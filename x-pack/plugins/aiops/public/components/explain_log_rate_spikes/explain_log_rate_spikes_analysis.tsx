/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useMemo, useState, FC } from 'react';
import { isEqual } from 'lodash';

import { EuiEmptyPrompt } from '@elastic/eui';

import type { DataView } from '@kbn/data-views-plugin/public';
import { ProgressControls } from '@kbn/aiops-components';
import { useFetchStream } from '@kbn/aiops-utils';
import type { WindowParameters } from '@kbn/aiops-utils';
import { FormattedMessage } from '@kbn/i18n-react';
import type { ChangePoint } from '@kbn/ml-agg-utils';
import type { Query } from '@kbn/es-query';

import { useAiOpsKibana } from '../../kibana_context';
import { initialState, streamReducer } from '../../../common/api/stream_reducer';
import type { ApiExplainLogRateSpikes } from '../../../common/api';

import { SpikeAnalysisTable } from '../spike_analysis_table';

/**
 * ExplainLogRateSpikes props require a data view.
 */
interface ExplainLogRateSpikesAnalysisProps {
  /** The data view to analyze. */
  dataView: DataView;
  /** Start timestamp filter */
  earliest: number;
  /** End timestamp filter */
  latest: number;
  /** Window parameters for the analysis */
  windowParameters: WindowParameters;
  searchQuery: Query['query'];
  onPinnedChangePoint?: (changePoint: ChangePoint | null) => void;
  onSelectedChangePoint?: (changePoint: ChangePoint | null) => void;
  selectedChangePoint?: ChangePoint;
}

export const ExplainLogRateSpikesAnalysis: FC<ExplainLogRateSpikesAnalysisProps> = ({
  dataView,
  earliest,
  latest,
  windowParameters,
  searchQuery,
  onPinnedChangePoint,
  onSelectedChangePoint,
  selectedChangePoint,
}) => {
  const { services } = useAiOpsKibana();
  const basePath = services.http?.basePath.get() ?? '';

  const [currentAnalysisWindowParameters, setCurrentAnalysisWindowParameters] = useState<
    WindowParameters | undefined
  >();

  const { cancel, start, data, isRunning, error } = useFetchStream<
    ApiExplainLogRateSpikes,
    typeof basePath
  >(
    `${basePath}/internal/aiops/explain_log_rate_spikes`,
    {
      start: earliest,
      end: latest,
      searchQuery: JSON.stringify(searchQuery),
      // TODO Handle data view without time fields.
      timeFieldName: dataView.timeFieldName ?? '',
      index: dataView.title,
      ...windowParameters,
    },
    { reducer: streamReducer, initialState }
  );

  useEffect(() => {
    setCurrentAnalysisWindowParameters(windowParameters);
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start handler clears possibly hovered or pinned
  // change points on analysis refresh.
  function startHandler() {
    if (onPinnedChangePoint) {
      onPinnedChangePoint(null);
    }
    if (onSelectedChangePoint) {
      onSelectedChangePoint(null);
    }

    setCurrentAnalysisWindowParameters(windowParameters);
    start();
  }

  const shouldRerunAnalysis = useMemo(
    () =>
      currentAnalysisWindowParameters !== undefined &&
      !isEqual(currentAnalysisWindowParameters, windowParameters),
    [currentAnalysisWindowParameters, windowParameters]
  );

  const showSpikeAnalysisTable = data?.changePoints.length > 0;

  return (
    <>
      <ProgressControls
        progress={data.loaded}
        progressMessage={data.loadingState ?? ''}
        isRunning={isRunning}
        onRefresh={startHandler}
        onCancel={cancel}
        shouldRerunAnalysis={shouldRerunAnalysis}
      />
      {!isRunning && !showSpikeAnalysisTable && (
        <EuiEmptyPrompt
          title={
            <h2>
              <FormattedMessage
                id="xpack.aiops.explainLogRateSpikesPage.noResultsPromptTitle"
                defaultMessage="The analysis did not return any results."
              />
            </h2>
          }
          titleSize="xs"
          body={
            <p>
              <FormattedMessage
                id="xpack.aiops.explainLogRateSpikesPage.noResultsPromptBody"
                defaultMessage="Try to adjust the baseline and deviation time ranges and rerun the analysis. If you still get no results, there might be no statistically significant entities contributing to this spike in log rates."
              />
            </p>
          }
        />
      )}
      {showSpikeAnalysisTable && (
        <SpikeAnalysisTable
          changePoints={data.changePoints}
          loading={isRunning}
          error={error}
          onPinnedChangePoint={onPinnedChangePoint}
          onSelectedChangePoint={onSelectedChangePoint}
          selectedChangePoint={selectedChangePoint}
        />
      )}
    </>
  );
};
