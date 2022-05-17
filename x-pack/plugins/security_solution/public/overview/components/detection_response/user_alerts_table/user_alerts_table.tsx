/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import styled from 'styled-components';

import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiEmptyPrompt,
  EuiHealth,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiTablePagination,
} from '@elastic/eui';

import { FormattedCount } from '../../../../common/components/formatted_number';
import { HeaderSection } from '../../../../common/components/header_section';
import { HoverVisibilityContainer } from '../../../../common/components/hover_visibility_container';
import { BUTTON_CLASS as INPECT_BUTTON_CLASS } from '../../../../common/components/inspect';
import { UserDetailsLink } from '../../../../common/components/links';
import { useQueryToggle } from '../../../../common/containers/query_toggle';
import { useNavigateToTimeline } from '../hooks';
import * as i18n from '../translations';
import { LastUpdatedAt, SEVERITY_COLOR } from '../utils';
import { UserAlertsItem, useUserAlertsItems } from './use_user_alerts_items';

interface UserAlertsTableProps {
  signalIndexName: string | null;
}

type GetTableColumns = (
  handleClick: (params: { userName: string; severity?: string }) => void
) => Array<EuiBasicTableColumn<UserAlertsItem>>;

const DETECTION_RESPONSE_USER_SEVERITY_QUERY_ID = 'vulnerableUsersBySeverityQuery';

// To Do remove this styled component once togglequery is updated: #131405
const StyledEuiPanel = styled(EuiPanel)`
  height: fit-content;
`;

export const UserAlertsTable = React.memo(({ signalIndexName }: UserAlertsTableProps) => {
  const { navigateToVulnerableUser } = useNavigateToTimeline();
  const { toggleStatus, setToggleStatus } = useQueryToggle(
    DETECTION_RESPONSE_USER_SEVERITY_QUERY_ID
  );
  const { items, isLoading, updatedAt, pagination } = useUserAlertsItems({
    skip: !toggleStatus,
    queryId: DETECTION_RESPONSE_USER_SEVERITY_QUERY_ID,
    signalIndexName,
  });

  const columns = useMemo(
    () => getTableColumns(navigateToVulnerableUser),
    [navigateToVulnerableUser]
  );

  return (
    <HoverVisibilityContainer show={true} targetClassNames={[INPECT_BUTTON_CLASS]}>
      <StyledEuiPanel hasBorder data-test-subj="severityUserAlertsPanel">
        <HeaderSection
          id={DETECTION_RESPONSE_USER_SEVERITY_QUERY_ID}
          title={i18n.USER_ALERTS_SECTION_TITLE}
          titleSize="s"
          toggleStatus={toggleStatus}
          toggleQuery={setToggleStatus}
          subtitle={<LastUpdatedAt updatedAt={updatedAt} isUpdating={isLoading} />}
          tooltip={i18n.USER_TOOLTIP}
        />
        {toggleStatus && (
          <>
            <EuiBasicTable
              data-test-subj="severityUserAlertsTable"
              columns={columns}
              items={items}
              loading={isLoading}
              noItemsMessage={
                <EuiEmptyPrompt title={<h3>{i18n.NO_ALERTS_FOUND}</h3>} titleSize="xs" />
              }
            />
            <EuiSpacer size="m" />
            {pagination.pageCount > 1 && (
              <EuiTablePagination
                data-test-subj="userTablePaginator"
                activePage={pagination.currentPage}
                itemsPerPage={4}
                pageCount={pagination.pageCount}
                onChangePage={pagination.setPage}
                showPerPageOptions={false}
              />
            )}
          </>
        )}
      </StyledEuiPanel>
    </HoverVisibilityContainer>
  );
});

UserAlertsTable.displayName = 'UserAlertsTable';

const getTableColumns: GetTableColumns = (handleClick) => [
  {
    field: 'userName',
    name: i18n.USER_ALERTS_USERNAME_COLUMN,
    truncateText: true,
    textOnly: true,
    'data-test-subj': 'userSeverityAlertsTable-userName',
    render: (userName: string) => <UserDetailsLink userName={userName} />,
  },
  {
    field: 'totalAlerts',
    name: i18n.ALERTS_TEXT,
    'data-test-subj': 'userSeverityAlertsTable-totalAlerts',
    render: (totalAlerts: number, { userName }) => (
      <EuiLink onClick={() => handleClick({ userName })}>
        <FormattedCount count={totalAlerts} />
      </EuiLink>
    ),
  },
  {
    field: 'critical',
    name: i18n.STATUS_CRITICAL_LABEL,
    render: (count: number, { userName }) => (
      <EuiHealth data-test-subj="userSeverityAlertsTable-critical" color={SEVERITY_COLOR.critical}>
        <EuiLink onClick={() => handleClick({ userName, severity: 'critical' })}>
          <FormattedCount count={count} />
        </EuiLink>
      </EuiHealth>
    ),
  },
  {
    field: 'high',
    name: i18n.STATUS_HIGH_LABEL,
    render: (count: number, { userName }) => (
      <EuiHealth data-test-subj="userSeverityAlertsTable-high" color={SEVERITY_COLOR.high}>
        <EuiLink onClick={() => handleClick({ userName, severity: 'high' })}>
          <FormattedCount count={count} />
        </EuiLink>
      </EuiHealth>
    ),
  },
  {
    field: 'medium',
    name: i18n.STATUS_MEDIUM_LABEL,
    render: (count: number, { userName }) => (
      <EuiHealth data-test-subj="userSeverityAlertsTable-medium" color={SEVERITY_COLOR.medium}>
        <EuiLink onClick={() => handleClick({ userName, severity: 'medium' })}>
          <FormattedCount count={count} />
        </EuiLink>
      </EuiHealth>
    ),
  },
  {
    field: 'low',
    name: i18n.STATUS_LOW_LABEL,
    render: (count: number, { userName }) => (
      <EuiHealth data-test-subj="userSeverityAlertsTable-low" color={SEVERITY_COLOR.low}>
        <EuiLink onClick={() => handleClick({ userName, severity: 'low' })}>
          <FormattedCount count={count} />
        </EuiLink>
      </EuiHealth>
    ),
  },
];
