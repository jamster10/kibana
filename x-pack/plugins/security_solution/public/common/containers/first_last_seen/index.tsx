/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import deepEqual from 'fast-deep-equal';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Subscription } from 'rxjs';

import { isCompleteResponse, isErrorResponse } from '@kbn/data-plugin/common';
import { useAppToasts } from '../../hooks/use_app_toasts';
import { useKibana } from '../../lib/kibana';

import * as i18n from './translations';
import {
  Direction,
  DocValueFields,
  FirstLastSeenQuery,
  FirstLastSeenRequestOptions,
  FirstLastSeenStrategyResponse,
} from '../../../../common/search_strategy';

const ID = 'firstLastSeenHostQuery';

export interface FirstLastSeenArgs {
  id: string;
  errorMessage: string | null;
  firstSeen?: string | null;
  lastSeen?: string | null;
  order: Direction.asc | Direction.desc | null;
}
interface UseFirstLastSeen {
  docValueFields: DocValueFields[];
  field: string;
  value: string;
  indexNames: string[];
  order: Direction.asc | Direction.desc;
}

export const useFirstLastSeen = ({
  docValueFields,
  field,
  value,
  indexNames,
  order,
}: UseFirstLastSeen): [boolean, FirstLastSeenArgs] => {
  const { search } = useKibana().services.data;
  const abortCtrl = useRef(new AbortController());
  const searchSubscription$ = useRef(new Subscription());
  const [loading, setLoading] = useState(false);

  const [firstLastSeenRequest, setFirstLastSeenRequest] = useState<FirstLastSeenRequestOptions>({
    defaultIndex: indexNames,
    docValueFields: docValueFields ?? [],
    factoryQueryType: FirstLastSeenQuery,
    field,
    value,
    order,
  });

  const [firstLastSeenResponse, setFirstLastSeenResponse] = useState<FirstLastSeenArgs>({
    order: null,
    firstSeen: null,
    lastSeen: null,
    errorMessage: null,
    id: ID,
  });
  const { addError, addWarning } = useAppToasts();

  const firstLastSeenSearch = useCallback(
    (request: FirstLastSeenRequestOptions) => {
      const asyncSearch = async () => {
        abortCtrl.current = new AbortController();
        setLoading(true);
        searchSubscription$.current = search
          .search<FirstLastSeenRequestOptions, FirstLastSeenStrategyResponse>(request, {
            strategy: 'securitySolutionSearchStrategy',
            abortSignal: abortCtrl.current.signal,
          })
          .subscribe({
            next: (response) => {
              if (isCompleteResponse(response)) {
                setLoading(false);
                setFirstLastSeenResponse((prevResponse) => ({
                  ...prevResponse,
                  errorMessage: null,
                  firstSeen: response.firstSeen,
                  lastSeen: response.lastSeen,
                }));
                searchSubscription$.current.unsubscribe();
              } else if (isErrorResponse(response)) {
                setLoading(false);
                addWarning(i18n.ERROR_FIRST_LAST_SEEN_HOST);
                searchSubscription$.current.unsubscribe();
              }
            },
            error: (msg) => {
              setLoading(false);
              setFirstLastSeenResponse((prevResponse) => ({
                ...prevResponse,
                errorMessage: msg,
              }));
              addError(msg, {
                title: i18n.FAIL_FIRST_LAST_SEEN_HOST,
              });
              searchSubscription$.current.unsubscribe();
            },
          });
      };
      searchSubscription$.current.unsubscribe();
      abortCtrl.current.abort();
      asyncSearch();
    },
    [search, addError, addWarning]
  );

  useEffect(() => {
    setFirstLastSeenRequest((prevRequest) => {
      const myRequest = {
        ...prevRequest,
        defaultIndex: indexNames,
        docValueFields: docValueFields ?? [],
        field,
        value,
      };
      if (!deepEqual(prevRequest, myRequest)) {
        return myRequest;
      }
      return prevRequest;
    });
  }, [docValueFields, field, indexNames, value]);

  useEffect(() => {
    firstLastSeenSearch(firstLastSeenRequest);
    return () => {
      searchSubscription$.current.unsubscribe();
      abortCtrl.current.abort();
    };
  }, [firstLastSeenRequest, firstLastSeenSearch]);

  return [loading, firstLastSeenResponse];
};
