/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { pick } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { CoreStart } from '@kbn/core/public';
import ReactDOM from 'react-dom';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { EuiEmptyPrompt, EuiIcon, EuiSpacer, EuiText } from '@elastic/eui';
import { Filter } from '@kbn/es-query';
import { Required } from 'utility-types';
import { FormattedMessage } from '@kbn/i18n-react';
import {
  Embeddable,
  EmbeddableInput,
  EmbeddableOutput,
  IContainer,
} from '@kbn/embeddable-plugin/public';
import { UI_SETTINGS } from '@kbn/data-plugin/common';
import { toMountPoint, wrapWithTheme } from '@kbn/kibana-react-plugin/public';
import { KibanaContextProvider, KibanaThemeProvider } from '@kbn/kibana-react-plugin/public';
import type { Query } from '@kbn/es-query';
import { DataView, DataViewField } from '@kbn/data-views-plugin/public';
import { DatePickerContextProvider } from '@kbn/ml-date-picker';
import type { SavedSearch } from '@kbn/discover-plugin/public';
import type { SamplingOption } from '../../../../../common/types/field_stats';
import { DATA_VISUALIZER_GRID_EMBEDDABLE_TYPE } from './constants';
import { EmbeddableLoading } from './embeddable_loading_fallback';
import { DataVisualizerStartDependencies } from '../../../../plugin';
import {
  DataVisualizerTable,
  ItemIdToExpandedRowMap,
} from '../../../common/components/stats_table';
import { FieldVisConfig } from '../../../common/components/stats_table/types';
import { getDefaultDataVisualizerListState } from '../../components/index_data_visualizer_view/index_data_visualizer_view';
import type { DataVisualizerTableState } from '../../../../../common/types';
import type { DataVisualizerIndexBasedAppState } from '../../types/index_data_visualizer_state';
import { IndexBasedDataVisualizerExpandedRow } from '../../../common/components/expanded_row/index_based_expanded_row';
import { useDataVisualizerGridData } from '../../hooks/use_data_visualizer_grid_data';

export type DataVisualizerGridEmbeddableServices = [CoreStart, DataVisualizerStartDependencies];
export interface DataVisualizerGridInput {
  dataView: DataView;
  savedSearch?: SavedSearch | null;
  query?: Query;
  visibleFieldNames?: string[];
  filters?: Filter[];
  showPreviewByDefault?: boolean;
  allowEditDataView?: boolean;
  id?: string;
  /**
   * Callback to add a filter to filter bar
   */
  onAddFilter?: (field: DataViewField | string, value: string, type: '+' | '-') => void;
  sessionId?: string;
  fieldsToFetch?: string[];
  totalDocuments?: number;
  samplingOption?: SamplingOption;
}
export type DataVisualizerGridEmbeddableInput = EmbeddableInput & DataVisualizerGridInput;
export type DataVisualizerGridEmbeddableOutput = EmbeddableOutput;

export type IDataVisualizerGridEmbeddable = typeof DataVisualizerGridEmbeddable;

const restorableDefaults = getDefaultDataVisualizerListState();

export const EmbeddableWrapper = ({
  input,
  onOutputChange,
}: {
  input: DataVisualizerGridEmbeddableInput;
  onOutputChange?: (ouput: any) => void;
}) => {
  const [dataVisualizerListState, setDataVisualizerListState] =
    useState<Required<DataVisualizerIndexBasedAppState>>(restorableDefaults);

  const onTableChange = useCallback(
    (update: DataVisualizerTableState) => {
      setDataVisualizerListState({ ...dataVisualizerListState, ...update });
      if (onOutputChange) {
        onOutputChange(update);
      }
    },
    [dataVisualizerListState, onOutputChange]
  );

  const {
    configs,
    searchQueryLanguage,
    searchString,
    extendedColumns,
    progress,
    overallStatsProgress,
    setLastRefresh,
  } = useDataVisualizerGridData(input, dataVisualizerListState);

  useEffect(() => {
    setLastRefresh(Date.now());
  }, [input?.lastReloadRequestTime, setLastRefresh]);

  const getItemIdToExpandedRowMap = useCallback(
    function (itemIds: string[], items: FieldVisConfig[]): ItemIdToExpandedRowMap {
      return itemIds.reduce((m: ItemIdToExpandedRowMap, fieldName: string) => {
        const item = items.find((fieldVisConfig) => fieldVisConfig.fieldName === fieldName);
        if (item !== undefined) {
          m[fieldName] = (
            <IndexBasedDataVisualizerExpandedRow
              item={item}
              dataView={input.dataView}
              combinedQuery={{ searchQueryLanguage, searchString }}
              onAddFilter={input.onAddFilter}
              totalDocuments={input.totalDocuments}
            />
          );
        }
        return m;
      }, {} as ItemIdToExpandedRowMap);
    },
    [input, searchQueryLanguage, searchString]
  );

  if (progress === 100 && configs.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flex: '1 0 100%',
          textAlign: 'center',
        }}
      >
        <EuiText size="xs" color="subdued">
          <EuiIcon type="visualizeApp" size="m" color="subdued" />
          <EuiSpacer size="m" />
          <FormattedMessage
            id="xpack.dataVisualizer.index.embeddableNoResultsMessage"
            defaultMessage="No results found"
          />
        </EuiText>
      </div>
    );
  }
  return (
    <DataVisualizerTable<FieldVisConfig>
      items={configs}
      pageState={dataVisualizerListState}
      updatePageState={onTableChange}
      getItemIdToExpandedRowMap={getItemIdToExpandedRowMap}
      extendedColumns={extendedColumns}
      showPreviewByDefault={input?.showPreviewByDefault}
      onChange={onOutputChange}
      loading={progress < 100}
      overallStatsRunning={overallStatsProgress.isRunning}
    />
  );
};

export const IndexDataVisualizerViewWrapper = (props: {
  id: string;
  embeddableContext: InstanceType<IDataVisualizerGridEmbeddable>;
  embeddableInput: Readonly<Observable<DataVisualizerGridEmbeddableInput>>;
  onOutputChange?: (output: any) => void;
}) => {
  const { embeddableInput, onOutputChange } = props;

  const input = useObservable(embeddableInput);
  if (input && input.dataView) {
    return <EmbeddableWrapper input={input} onOutputChange={onOutputChange} />;
  } else {
    return (
      <EuiEmptyPrompt
        iconType="alert"
        iconColor="danger"
        title={
          <h2>
            <FormattedMessage
              id="xpack.dataVisualizer.index.embeddableErrorTitle"
              defaultMessage="Error loading embeddable"
            />
          </h2>
        }
        body={
          <p>
            <FormattedMessage
              id="xpack.dataVisualizer.index.embeddableErrorDescription"
              defaultMessage="There was an error loading the embeddable. Please check if all the required input is valid."
            />
          </p>
        }
      />
    );
  }
};
export class DataVisualizerGridEmbeddable extends Embeddable<
  DataVisualizerGridEmbeddableInput,
  DataVisualizerGridEmbeddableOutput
> {
  private node?: HTMLElement;
  private reload$ = new Subject<void>();
  public readonly type: string = DATA_VISUALIZER_GRID_EMBEDDABLE_TYPE;

  constructor(
    initialInput: DataVisualizerGridEmbeddableInput,
    public services: DataVisualizerGridEmbeddableServices,
    parent?: IContainer
  ) {
    super(initialInput, {}, parent);
  }

  public render(node: HTMLElement) {
    super.render(node);
    this.node = node;

    const I18nContext = this.services[0].i18n.Context;

    const services = { ...this.services[0], ...this.services[1] };
    const datePickerDeps = {
      ...pick(services, ['data', 'http', 'notifications', 'theme', 'uiSettings']),
      toMountPoint,
      wrapWithTheme,
      uiSettingsKeys: UI_SETTINGS,
    };

    ReactDOM.render(
      <I18nContext>
        <KibanaThemeProvider theme$={this.services[0].theme.theme$}>
          <KibanaContextProvider services={services}>
            <DatePickerContextProvider {...datePickerDeps}>
              <Suspense fallback={<EmbeddableLoading />}>
                <IndexDataVisualizerViewWrapper
                  id={this.input.id}
                  embeddableContext={this}
                  embeddableInput={this.getInput$()}
                  onOutputChange={(output) => this.updateOutput(output)}
                />
              </Suspense>
            </DatePickerContextProvider>
          </KibanaContextProvider>
        </KibanaThemeProvider>
      </I18nContext>,
      node
    );
  }

  public destroy() {
    super.destroy();
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
  }

  public reload() {
    this.reload$.next();
  }

  public supportedTriggers() {
    return [];
  }
}
