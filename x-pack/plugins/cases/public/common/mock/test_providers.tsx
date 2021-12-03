/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { merge } from 'lodash';
import { euiDarkVars } from '@kbn/ui-shared-deps-src/theme';
import { I18nProvider } from '@kbn/i18n-react';
import { ThemeProvider } from 'styled-components';
import { DEFAULT_FEATURES, SECURITY_SOLUTION_OWNER } from '../../../common/constants';
import { CasesFeatures } from '../../../common/ui/types';
import { CasesProvider } from '../../components/cases_context';
import { createKibanaContextProviderMock } from '../lib/kibana/kibana_react.mock';
import { FieldHook } from '../shared_imports';
interface Props {
  children: React.ReactNode;
  caseConfig?: Partial<CasesContextValue>;
}

window.scrollTo = jest.fn();
const MockKibanaContextProvider = createKibanaContextProviderMock();

const defaultCaseConfig = {
  userCanCrud: true,
  owner: [SECURITY_SOLUTION_OWNER],
  features: DEFAULT_FEATURES,
};

/** A utility for wrapping children in the providers required to run most tests */
const TestProvidersComponent: React.FC<Props> = ({ children, caseConfig }) => (
  <I18nProvider>
    <MockKibanaContextProvider>
      <ThemeProvider theme={() => ({ eui: euiDarkVars, darkMode: true })}>
        <CasesProvider value={merge(defaultCaseConfig, caseConfig)}>{children}</CasesProvider>
      </ThemeProvider>
    </MockKibanaContextProvider>
  </I18nProvider>
);

export const TestProviders = React.memo(TestProvidersComponent);

export const useFormFieldMock = <T,>(options?: Partial<FieldHook<T>>): FieldHook<T> => ({
  path: 'path',
  type: 'type',
  value: 'mockedValue' as unknown as T,
  isPristine: false,
  isDirty: false,
  isModified: false,
  isValidating: false,
  isValidated: false,
  isChangingValue: false,
  errors: [],
  isValid: true,
  getErrorsMessages: jest.fn(),
  onChange: jest.fn(),
  setValue: jest.fn(),
  setErrors: jest.fn(),
  clearErrors: jest.fn(),
  validate: jest.fn(),
  reset: jest.fn(),
  __isIncludedInOutput: true,
  __serializeValue: jest.fn(),
  ...options,
});
