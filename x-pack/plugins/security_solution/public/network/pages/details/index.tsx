/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { getEsQueryConfig } from '@kbn/data-plugin/common';
import { euiStyled } from '@kbn/kibana-react-plugin/common';
import { euiThemeVars } from '@kbn/ui-theme';

import { InputsModelId } from '../../../common/store/inputs/constants';
import { useDeepEqualSelector } from '../../../common/hooks/use_selector';
import { LastEventIndexKey } from '../../../../common/search_strategy';
import type { FlowTargetSourceDest } from '../../../../common/search_strategy';
import { useGlobalTime } from '../../../common/containers/use_global_time';
import { FiltersGlobal } from '../../../common/components/filters_global';
import { HeaderPage } from '../../../common/components/header_page';
import { LastEventTime } from '../../../common/components/last_event_time';
import { useAnomaliesTableData } from '../../../common/components/ml/anomaly/use_anomalies_table_data';
import { networkToCriteria } from '../../../common/components/ml/criteria/network_to_criteria';
import { scoreIntervalToDateTime } from '../../../common/components/ml/score/score_interval_to_datetime';
import { manageQuery } from '../../../common/components/page/manage_query';
import { FlowTargetSelectConnected } from '../../components/flow_target_select_connected';
import { IpOverview } from '../../components/details';
import { SiemSearchBar } from '../../../common/components/search_bar';
import { SecuritySolutionPageWrapper } from '../../../common/components/page_wrapper';
import { useNetworkDetails, ID } from '../../containers/details';
import { useKibana } from '../../../common/lib/kibana';
import { decodeIpv6 } from '../../../common/lib/helpers';
import { convertToBuildEsQuery } from '../../../common/lib/keury';
import { inputsSelectors } from '../../../common/store';
import { setAbsoluteRangeDatePicker } from '../../../common/store/inputs/actions';
import { setNetworkDetailsTablesActivePageToZero } from '../../store/actions';
import { SpyRoute } from '../../../common/utils/route/spy_routes';
import { networkModel } from '../../store';
import { SecurityPageName } from '../../../app/types';
import { useSourcererDataView } from '../../../common/containers/sourcerer';
import { useInvalidFilterQuery } from '../../../common/hooks/use_invalid_filter_query';
import { LandingPageComponent } from '../../../common/components/landing_page';
import { SecuritySolutionTabNavigation } from '../../../common/components/navigation';
import { getNetworkDetailsPageFilter } from '../../../common/components/visualization_actions/utils';
import { hasMlUserPermissions } from '../../../../common/machine_learning/has_ml_user_permissions';
import { AlertCountByStatus } from '../../../common/components/alert_count_by_status';
import { useMlCapabilities } from '../../../common/components/ml/hooks/use_ml_capabilities';
import { useAlertsPrivileges } from '../../../detections/containers/detection_engine/alerts/use_alerts_privileges';
import { navTabsNetworkDetails } from './nav_tabs';
import { NetworkDetailsTabs } from './details_tabs';
import { useInstalledSecurityJobsIds } from '../../../common/components/ml/hooks/use_installed_security_jobs';

export { getTrailingBreadcrumbs } from './utils';

const NetworkDetailsManage = manageQuery(IpOverview);

const StyledEuiFlexItem = euiStyled(EuiFlexItem)`
  border: 1px solid ${euiThemeVars.euiColorLightShade};
  border-radius: 5px;
  padding: 12px;
  width: 100%;
`;

const NetworkDetailsComponent: React.FC = () => {
  const dispatch = useDispatch();
  const capabilities = useMlCapabilities();
  const { to, from, setQuery, isInitializing } = useGlobalTime();
  const { detailName, flowTarget } = useParams<{
    detailName: string;
    flowTarget: FlowTargetSourceDest;
  }>();
  const getGlobalQuerySelector = useMemo(() => inputsSelectors.globalQuerySelector(), []);
  const getGlobalFiltersQuerySelector = useMemo(
    () => inputsSelectors.globalFiltersQuerySelector(),
    []
  );

  const { hasKibanaREAD, hasIndexRead } = useAlertsPrivileges();
  const canReadAlerts = hasKibanaREAD && hasIndexRead;

  const query = useDeepEqualSelector(getGlobalQuerySelector);
  const filters = useDeepEqualSelector(getGlobalFiltersQuerySelector);

  const type = networkModel.NetworkType.details;
  const narrowDateRange = useCallback(
    (score, interval) => {
      const fromTo = scoreIntervalToDateTime(score, interval);
      dispatch(
        setAbsoluteRangeDatePicker({
          id: InputsModelId.global,
          from: fromTo.from,
          to: fromTo.to,
        })
      );
    },
    [dispatch]
  );
  const {
    services: { uiSettings },
  } = useKibana();

  useEffect(() => {
    dispatch(setNetworkDetailsTablesActivePageToZero());
  }, [detailName, dispatch]);

  const { indicesExist, indexPattern, selectedPatterns } = useSourcererDataView();
  const ip = decodeIpv6(detailName);

  const queryFilters = useMemo(
    () => [...getNetworkDetailsPageFilter(ip), ...filters],
    [filters, ip]
  );

  const [filterQuery, kqlError] = convertToBuildEsQuery({
    config: getEsQueryConfig(uiSettings),
    indexPattern,
    queries: [query],
    filters: queryFilters,
  });

  useInvalidFilterQuery({ id: ID, filterQuery, kqlError, query, startDate: from, endDate: to });

  const [loading, { id, inspect, networkDetails, refetch }] = useNetworkDetails({
    skip: isInitializing,
    filterQuery,
    indexNames: selectedPatterns,
    ip,
  });

  const { jobIds } = useInstalledSecurityJobsIds();
  const [isLoadingAnomaliesData, anomaliesData] = useAnomaliesTableData({
    criteriaFields: networkToCriteria(detailName, flowTarget),
    startDate: from,
    endDate: to,
    skip: isInitializing,
    jobIds,
    aggregationInterval: 'auto',
  });

  const headerDraggableArguments = useMemo(
    () => ({ field: `${flowTarget}.ip`, value: ip }),
    [flowTarget, ip]
  );

  // When the filterQuery comes back as undefined, it means an error has been thrown and the request should be skipped
  const shouldSkip = useMemo(
    () => isInitializing || filterQuery === undefined,
    [isInitializing, filterQuery]
  );

  return (
    <div data-test-subj="network-details-page">
      {indicesExist ? (
        <>
          <FiltersGlobal>
            <SiemSearchBar indexPattern={indexPattern} id={InputsModelId.global} />
          </FiltersGlobal>

          <SecuritySolutionPageWrapper>
            <HeaderPage
              data-test-subj="network-details-headline"
              draggableArguments={headerDraggableArguments}
              subtitle={
                <LastEventTime
                  indexKey={LastEventIndexKey.ipDetails}
                  indexNames={selectedPatterns}
                  ip={ip}
                />
              }
              title={ip}
            >
              <FlowTargetSelectConnected flowTarget={flowTarget} />
            </HeaderPage>
            <EuiFlexGroup>
              <StyledEuiFlexItem grow={3}>
                <NetworkDetailsManage
                  id={id}
                  inspect={inspect}
                  ip={ip}
                  isInDetailsSidePanel={false}
                  data={networkDetails}
                  anomaliesData={anomaliesData}
                  loading={loading}
                  isLoadingAnomaliesData={isLoadingAnomaliesData}
                  type={type}
                  flowTarget={flowTarget}
                  refetch={refetch}
                  setQuery={setQuery}
                  startDate={from}
                  endDate={to}
                  narrowDateRange={narrowDateRange}
                  indexPatterns={selectedPatterns}
                />
              </StyledEuiFlexItem>
              {canReadAlerts && (
                <EuiFlexItem>
                  <AlertCountByStatus field={`${flowTarget}.ip`} value={detailName} />
                </EuiFlexItem>
              )}
            </EuiFlexGroup>

            <EuiSpacer />
            <SecuritySolutionTabNavigation
              navTabs={navTabsNetworkDetails(ip, hasMlUserPermissions(capabilities), flowTarget)}
            />
            <EuiSpacer />
            <NetworkDetailsTabs
              ip={ip}
              endDate={to}
              startDate={from}
              filterQuery={filterQuery}
              indexNames={selectedPatterns}
              skip={shouldSkip}
              setQuery={setQuery}
              indexPattern={indexPattern}
              flowTarget={flowTarget}
            />
          </SecuritySolutionPageWrapper>
        </>
      ) : (
        <LandingPageComponent />
      )}

      <SpyRoute pageName={SecurityPageName.network} />
    </div>
  );
};

NetworkDetailsComponent.displayName = 'NetworkDetailsComponent';

export const NetworkDetails = React.memo(NetworkDetailsComponent);
