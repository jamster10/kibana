/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { EuiCheckbox } from '@elastic/eui';
import type { Filter } from '@kbn/es-query';
import type { EntityType } from '@kbn/timelines-plugin/common';

import type { TimelineId } from '../../../../common/types/timeline';
import { RowRendererId } from '../../../../common/types/timeline';
import { StatefulEventsViewer } from '../events_viewer';
import { timelineActions } from '../../../timelines/store/timeline';
import { eventsDefaultModel } from '../events_viewer/default_model';
import { MatrixHistogram } from '../matrix_histogram';
import { useGlobalFullScreen } from '../../containers/use_full_screen';
import * as i18n from './translations';
import { DEFAULT_NUMBER_FORMAT } from '../../../../common/constants';
import {
  alertsHistogramConfig,
  eventsHistogramConfig,
  getSubtitle,
} from './histogram_configurations';
import { getDefaultControlColumn } from '../../../timelines/components/timeline/body/control_columns';
import { defaultRowRenderers } from '../../../timelines/components/timeline/body/renderers';
import { DefaultCellRenderer } from '../../../timelines/components/timeline/cell_rendering/default_cell_renderer';
import { SourcererScopeName } from '../../store/sourcerer/model';
import { useIsExperimentalFeatureEnabled } from '../../hooks/use_experimental_features';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../../../timelines/components/timeline/body/constants';
import { defaultCellActions } from '../../lib/cell_actions/default_cell_actions';
import type { GlobalTimeArgs } from '../../containers/use_global_time';
import type { QueryTabBodyProps as UserQueryTabBodyProps } from '../../../users/pages/navigation/types';
import type { QueryTabBodyProps as HostQueryTabBodyProps } from '../../../hosts/pages/navigation/types';
import type { QueryTabBodyProps as NetworkQueryTabBodyProps } from '../../../network/pages/navigation/types';

import { useUiSetting$ } from '../../lib/kibana';
import { defaultAlertsFilters } from '../events_viewer/external_alerts_filter';

const ACTION_BUTTON_COUNT = 5;
export const ALERTS_EVENTS_HISTOGRAM_ID = 'alertsOrEventsHistogramQuery';

type QueryTabBodyProps = UserQueryTabBodyProps | HostQueryTabBodyProps | NetworkQueryTabBodyProps;

export type EventsQueryTabBodyComponentProps = QueryTabBodyProps & {
  deleteQuery?: GlobalTimeArgs['deleteQuery'];
  indexNames: string[];
  pageFilters?: Filter[];
  externalAlertPageFilters?: Filter[];
  setQuery: GlobalTimeArgs['setQuery'];
  timelineId: TimelineId;
};

const EventsQueryTabBodyComponent: React.FC<EventsQueryTabBodyComponentProps> = ({
  deleteQuery,
  endDate,
  filterQuery,
  indexNames,
  externalAlertPageFilters,
  pageFilters,
  setQuery,
  startDate,
  timelineId,
}) => {
  const dispatch = useDispatch();
  const { globalFullScreen } = useGlobalFullScreen();
  const tGridEnabled = useIsExperimentalFeatureEnabled('tGridEnabled');
  const [defaultNumberFormat] = useUiSetting$<string>(DEFAULT_NUMBER_FORMAT);
  const [showExternalAlerts, setShowExternalAlerts] = useState(false);
  const leadingControlColumns = useMemo(() => getDefaultControlColumn(ACTION_BUTTON_COUNT), []);

  const toggleExternalAlerts = useCallback(() => setShowExternalAlerts((s) => !s), []);

  const histogramExtraProps = useMemo(
    () => ({
      ...(showExternalAlerts
        ? {
            ...alertsHistogramConfig,
            subtitle: getSubtitle(defaultNumberFormat),
          }
        : {
            ...eventsHistogramConfig,
            unit: i18n.EVENTS_UNIT,
          }),
    }),
    [defaultNumberFormat, showExternalAlerts]
  );

  const statefulEventsViewerExtraProps = useMemo(
    () => ({
      ...(showExternalAlerts
        ? {
            pageFilters: [defaultAlertsFilters, ...(externalAlertPageFilters || [])],
          }
        : {
            pageFilters,
            unit: i18n.EVENTS_UNIT,
          }),
    }),
    [showExternalAlerts, externalAlertPageFilters, pageFilters]
  );

  useEffect(() => {
    dispatch(
      timelineActions.initializeTGridSettings({
        id: timelineId,
        defaultColumns: eventsDefaultModel.columns.map((c) =>
          !tGridEnabled && c.initialWidth == null
            ? {
                ...c,
                initialWidth: DEFAULT_COLUMN_MIN_WIDTH,
              }
            : c
        ),
        excludedRowRendererIds: showExternalAlerts ? Object.values(RowRendererId) : undefined,
      })
    );
  }, [dispatch, showExternalAlerts, tGridEnabled, timelineId]);

  useEffect(() => {
    return () => {
      if (deleteQuery) {
        deleteQuery({ id: ALERTS_EVENTS_HISTOGRAM_ID });
      }
    };
  }, [deleteQuery]);

  return (
    <>
      {!globalFullScreen && (
        <MatrixHistogram
          id={ALERTS_EVENTS_HISTOGRAM_ID}
          endDate={endDate}
          filterQuery={filterQuery}
          setQuery={setQuery}
          startDate={startDate}
          indexNames={indexNames}
          {...histogramExtraProps}
        />
      )}
      <StatefulEventsViewer
        additionalFilters={
          <EuiCheckbox
            id="showExternalAlertsCheckbox"
            aria-label={i18n.SHOW_EXTERNAL_ALERTS}
            onChange={toggleExternalAlerts}
            checked={showExternalAlerts}
            color="text"
            data-test-subj="showExternalAlertsCheckbox"
            label={i18n.SHOW_EXTERNAL_ALERTS}
          />
        }
        defaultCellActions={defaultCellActions}
        end={endDate}
        entityType={'events' as EntityType}
        leadingControlColumns={leadingControlColumns}
        renderCellValue={DefaultCellRenderer}
        rowRenderers={defaultRowRenderers}
        scopeId={SourcererScopeName.default}
        start={startDate}
        id={timelineId}
        defaultModel={{
          ...eventsDefaultModel,
          excludedRowRendererIds: showExternalAlerts ? Object.values(RowRendererId) : [],
        }}
        {...statefulEventsViewerExtraProps}
      />
    </>
  );
};

EventsQueryTabBodyComponent.displayName = 'EventsQueryTabBodyComponent';

export const EventsQueryTabBody = React.memo(EventsQueryTabBodyComponent);

EventsQueryTabBody.displayName = 'EventsQueryTabBody';
