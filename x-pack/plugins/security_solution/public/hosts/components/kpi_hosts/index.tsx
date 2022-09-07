/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { EuiFlexItem, EuiFlexGroup, EuiSpacer, EuiLink } from '@elastic/eui';

import { CallOutSwitcher } from '../../../common/components/callouts';
import { useHostRiskScore } from '../../../risk_score/containers';
import { HostsKpiHosts } from './hosts';
import * as i18n from './translations';
import type { HostsKpiProps } from './types';
import { HostsKpiUniqueIps } from './unique_ips';
import { RISKY_HOSTS_DOC_LINK } from '../../../../common/constants';

export const HostsKpiComponent = React.memo<HostsKpiProps>(
  ({ filterQuery, from, indexNames, to, setQuery, skip, updateDateRange }) => {
    const [loading, { isLicenseValid, isModuleEnabled }] = useHostRiskScore();

    return (
      <>
        {isLicenseValid && !isModuleEnabled && !loading && (
          <>
            <CallOutSwitcher
              namespace="hosts"
              condition
              message={{
                type: 'primary',
                id: 'hostRiskModule',
                title: i18n.ENABLE_HOST_RISK_TEXT,
                description: (
                  <>
                    {i18n.LEARN_MORE}{' '}
                    <EuiLink href={RISKY_HOSTS_DOC_LINK} target="_blank">
                      {i18n.HOST_RISK_DATA}
                    </EuiLink>
                    <EuiSpacer />
                  </>
                ),
              }}
            />
            <EuiSpacer size="l" />
          </>
        )}

        <EuiFlexGroup wrap>
          <EuiFlexItem grow={1}>
            <HostsKpiHosts
              filterQuery={filterQuery}
              from={from}
              indexNames={indexNames}
              to={to}
              updateDateRange={updateDateRange}
              setQuery={setQuery}
              skip={skip}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={2}>
            <HostsKpiUniqueIps
              filterQuery={filterQuery}
              from={from}
              indexNames={indexNames}
              to={to}
              updateDateRange={updateDateRange}
              setQuery={setQuery}
              skip={skip}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    );
  }
);

HostsKpiComponent.displayName = 'HostsKpiComponent';

export const HostsDetailsKpiComponent = React.memo<HostsKpiProps>(
  ({ filterQuery, from, indexNames, to, setQuery, skip, updateDateRange }) => {
    return (
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={3}>
          <HostsKpiUniqueIps
            filterQuery={filterQuery}
            from={from}
            indexNames={indexNames}
            to={to}
            updateDateRange={updateDateRange}
            setQuery={setQuery}
            skip={skip}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
);

HostsDetailsKpiComponent.displayName = 'HostsDetailsKpiComponent';
