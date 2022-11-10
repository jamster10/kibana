/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Position } from '@elastic/charts';
import { omit } from 'lodash/fp';
import React, { useEffect } from 'react';

import type { inputsModel } from '../../store';
import type { GlobalTimeArgs } from '../../containers/use_global_time';
import type { InputsModelId } from '../../store/inputs/constants';

export interface OwnProps extends Pick<GlobalTimeArgs, 'deleteQuery' | 'setQuery'> {
  headerChildren?: React.ReactNode;
  id: string;
  inputId?: InputsModelId;
  inspect?: inputsModel.InspectQuery;
  legendPosition?: Position;
  loading: boolean;
  refetch: inputsModel.Refetch;
  searchSessionId?: string;
}

export function manageQuery<T>(
  WrappedComponent: React.ComponentClass<T> | React.ComponentType<T>
): React.FC<OwnProps & T> {
  const ManageQuery = (props: OwnProps & T) => {
    const { deleteQuery, id, inspect = null, loading, refetch, setQuery, searchSessionId } = props;

    useQueryInspector({
      deleteQuery,
      inspect,
      loading,
      queryId: id,
      refetch,
      searchSessionId,
      setQuery,
    });

    const otherProps = omit(['refetch', 'setQuery'], props);
    return <WrappedComponent {...(otherProps as T)} />;
  };

  ManageQuery.displayName = `ManageQuery (${WrappedComponent?.displayName ?? 'Unknown'})`;
  return ManageQuery;
}

interface UseQueryInspectorTypes extends Pick<GlobalTimeArgs, 'deleteQuery' | 'setQuery'> {
  queryId: string;
  legendPosition?: Position;
  loading: boolean;
  refetch: inputsModel.Refetch;
  inspect?: inputsModel.InspectQuery | null;
  searchSessionId?: string;
}

export const useQueryInspector = ({
  setQuery,
  deleteQuery,
  refetch,
  inspect,
  loading,
  queryId,
  searchSessionId,
}: UseQueryInspectorTypes) => {
  useEffect(() => {
    setQuery({ id: queryId, inspect: inspect ?? null, loading, refetch, searchSessionId });
  }, [deleteQuery, setQuery, queryId, refetch, inspect, loading, searchSessionId]);

  useEffect(() => {
    return () => {
      if (deleteQuery) {
        deleteQuery({ id: queryId });
      }
    };
  }, [deleteQuery, queryId]);
};
