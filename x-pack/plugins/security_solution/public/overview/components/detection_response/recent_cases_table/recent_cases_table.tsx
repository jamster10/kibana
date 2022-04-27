/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo } from 'react';

import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButton,
  EuiEmptyPrompt,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { CaseStatuses } from '@kbn/cases-plugin/common';

import { SecurityPageName } from '../../../../app/types';
import { FormattedDate } from '../../../../common/components/formatted_date';
import { HeaderSection } from '../../../../common/components/header_section';
import { HoverVisibilityContainer } from '../../../../common/components/hover_visibility_container';
import { BUTTON_CLASS as INPECT_BUTTON_CLASS } from '../../../../common/components/inspect';
import { CaseDetailsLink } from '../../../../common/components/links';
import { useQueryToggle } from '../../../../common/containers/query_toggle';
import { useNavigation, NavigateTo, GetAppUrl } from '../../../../common/lib/kibana';
import * as i18n from '../translations';
import { LastUpdatedAt } from '../util';
import { StatusBadge } from './status_badge';
import { RecentCaseItem, useRecentlyCreatedCases } from './use_recent_cases_items';

type GetTableColumns = (params: {
  getAppUrl: GetAppUrl;
  navigateTo: NavigateTo;
}) => Array<EuiBasicTableColumn<RecentCaseItem>>;

const DETECTION_RESPONSE_RECENT_CASES_QUERY_ID = 'recentlyCreatedCasesQuery';

export const RecentlyCreatedCasesTable = React.memo(() => {
  const { getAppUrl, navigateTo } = useNavigation();
  const { toggleStatus, setToggleStatus } = useQueryToggle(
    DETECTION_RESPONSE_RECENT_CASES_QUERY_ID
  );
  const { items, isLoading, updatedAt } = useRecentlyCreatedCases({
    skip: !toggleStatus,
  });

  const navigateToCases = useCallback(() => {
    navigateTo({ deepLinkId: SecurityPageName.case });
  }, [navigateTo]);

  const columns = useMemo(
    () => getTableColumns({ getAppUrl, navigateTo }),
    [getAppUrl, navigateTo]
  );

  return (
    <HoverVisibilityContainer show={true} targetClassNames={[INPECT_BUTTON_CLASS]}>
      <EuiPanel hasBorder data-test-subj="recentlyCreatedCasesPanel">
        <HeaderSection
          id={DETECTION_RESPONSE_RECENT_CASES_QUERY_ID}
          title={i18n.RECENT_CASES_SECTION_TITLE}
          titleSize="s"
          toggleStatus={toggleStatus}
          toggleQuery={setToggleStatus}
          subtitle={<LastUpdatedAt updatedAt={updatedAt} isUpdating={isLoading} />}
        />

        {toggleStatus && (
          <>
            <EuiBasicTable
              data-test-subj="recentlyCreatedCasesTable"
              columns={columns}
              items={items}
              loading={isLoading}
              noItemsMessage={
                <EuiEmptyPrompt title={<h3>{i18n.NO_CASES_FOUND}</h3>} titleSize="xs" />
              }
            />
            <EuiSpacer size="m" />
            <EuiButton data-test-subj="allCasesButton" onClick={navigateToCases}>
              {i18n.VIEW_RECENT_CASES}
            </EuiButton>
          </>
        )}
      </EuiPanel>
    </HoverVisibilityContainer>
  );
});

RecentlyCreatedCasesTable.displayName = 'RecentlyCreatedCasesTable';

const getTableColumns: GetTableColumns = () => [
  {
    field: 'id',
    name: i18n.RECENTLY_CREATED_CASE_COLUMN_NAME,
    truncateText: true,
    textOnly: true,
    'data-test-subj': 'recentlyCreatedCaseName',

    render: (id: string, { name }) => <CaseDetailsLink detailName={id}>{name}</CaseDetailsLink>,
  },
  {
    field: 'note',
    name: i18n.RECENTLY_CREATED_CASE_COLUMN_NOTE,
    truncateText: true,
    textOnly: true,
    render: (note: string) => (
      <EuiText data-test-subj="recentlyCreatedCaseNote" size="s">
        {note}
      </EuiText>
    ),
  },
  {
    field: 'createdAt',
    name: i18n.RECENTLY_CREATED_CASE_COLUMN_TIME,
    render: (createdAt: string) => (
      <FormattedDate
        fieldName={i18n.RECENTLY_CREATED_CASE_COLUMN_TIME}
        value={createdAt}
        className="eui-textTruncate"
        dateFormat="MMMM D, YYYY"
      />
    ),
    'data-test-subj': 'recentlyCreatedCaseTime',
  },
  {
    field: 'createdBy',
    name: i18n.RECENTLY_CREATED_CASE_COLUMN_CREATED_BY,
    render: (createdBy: string) => (
      <EuiText data-test-subj="recentlyCreatedCaseCreatedBy" size="s">
        {createdBy}
      </EuiText>
    ),
  },
  {
    field: 'status',
    name: i18n.RECENTLY_CREATED_CASE_COLUMN_STATUS,
    render: (status: CaseStatuses) => <StatusBadge status={status} />,
    'data-test-subj': 'recentlyCreatedCaseStatus',
  },
];
