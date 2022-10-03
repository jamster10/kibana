/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { noop, startsWith, endsWith } from 'lodash/fp';
import type { EuiComboBoxOptionOption } from '@elastic/eui';
import {
  EuiButton,
  EuiComboBox,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiSpacer,
} from '@elastic/eui';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';

import type { BrowserFields } from '../../../common/containers/source';
import type { OnDataProviderEdited } from '../timeline/events';
import type { QueryOperator } from '../timeline/data_providers/data_provider';
import { DataProviderType } from '../timeline/data_providers/data_provider';

import {
  getCategorizedFieldNames,
  getExcludedFromSelection,
  getQueryOperatorFromSelection,
  operatorLabels,
  selectionsAreValid,
} from './helpers';

import * as i18n from './translations';

const EDIT_DATA_PROVIDER_WIDTH = 400;
const OPERATOR_COMBO_BOX_WIDTH = 152;
const SAVE_CLASS_NAME = 'edit-data-provider-save';
const VALUE_INPUT_CLASS_NAME = 'edit-data-provider-value';

export const HeaderContainer = styled.div`
  width: ${EDIT_DATA_PROVIDER_WIDTH};
`;

HeaderContainer.displayName = 'HeaderContainer';

interface Props {
  andProviderId?: string;
  browserFields: BrowserFields;
  field: string;
  isExcluded: boolean;
  onDataProviderEdited: OnDataProviderEdited;
  operator: QueryOperator;
  providerId: string;
  timelineId: string;
  value: string | number | Array<string | number>;
  type?: DataProviderType;
}

const sanatizeValue = (value: string | number): string =>
  Array.isArray(value) ? `${value[0]}` : `${value}`; // fun fact: value should never be an array

export const getInitialOperatorLabel = (
  isExcluded: boolean,
  operator: QueryOperator
): EuiComboBoxOptionOption[] => {
  if (operator === ':') {
    return isExcluded ? [{ label: i18n.IS_NOT }] : [{ label: i18n.IS }];
  } else if (operator === 'includes') {
    return isExcluded ? [{ label: i18n.IS_NOT_ONE_OF }] : [{ label: i18n.IS_ONE_OF }];
  } else {
    return isExcluded ? [{ label: i18n.DOES_NOT_EXIST }] : [{ label: i18n.EXISTS }];
  }
};

export const StatefulEditDataProvider = React.memo<Props>(
  ({
    andProviderId,
    browserFields,
    field,
    isExcluded,
    onDataProviderEdited,
    operator,
    providerId,
    timelineId,
    value,
    type = DataProviderType.default,
  }) => {
    const [updatedField, setUpdatedField] = useState<EuiComboBoxOptionOption[]>([{ label: field }]);
    const [updatedOperator, setUpdatedOperator] = useState<EuiComboBoxOptionOption[]>(
      getInitialOperatorLabel(isExcluded, operator)
    );

    const [disableButton, setDisableButton] = useState<boolean>(true);
    const [updatedValue, setUpdatedValue] = useState<string | number | Array<string | number>>(
      value
    );

    const disableButtonCallback = useCallback(
      (shouldDisable) => setDisableButton(shouldDisable),
      []
    );

    const showComboBoxInput =
      updatedOperator[0].label === i18n.IS_ONE_OF ||
      updatedOperator[0].label === i18n.IS_NOT_ONE_OF;

    const showValueInput =
      type !== DataProviderType.template &&
      updatedOperator.length > 0 &&
      updatedOperator[0].label !== i18n.EXISTS &&
      updatedOperator[0].label !== i18n.DOES_NOT_EXIST &&
      !showComboBoxInput;

    /** Focuses the Value input if it is visible, falling back to the Save button if it's not */
    const focusInput = () => {
      const elements = document.getElementsByClassName(VALUE_INPUT_CLASS_NAME);

      if (elements.length > 0) {
        (elements[0] as HTMLElement).focus(); // this cast is required because focus() does not exist on every `Element` returned by `getElementsByClassName`
      } else {
        const saveElements = document.getElementsByClassName(SAVE_CLASS_NAME);

        if (saveElements.length > 0) {
          (saveElements[0] as HTMLElement).focus();
        }
      }
    };

    const onFieldSelected = useCallback(
      (selectedField: EuiComboBoxOptionOption[]) => {
        setUpdatedField(selectedField);

        if (type === DataProviderType.template) {
          setUpdatedValue(`{${selectedField[0].label}}`);
        }

        focusInput();
      },
      [type]
    );

    const onOperatorSelected = useCallback((operatorSelected: EuiComboBoxOptionOption[]) => {
      setUpdatedOperator(operatorSelected);

      focusInput();
    }, []);

    const onValueChange = useCallback((changedValue: string | number | string[]) => {
      setUpdatedValue(changedValue);
    }, []);

    const disableScrolling = () => {
      const x =
        window.pageXOffset !== undefined
          ? window.pageXOffset
          : (document.documentElement || document.body.parentNode || document.body).scrollLeft;

      const y =
        window.pageYOffset !== undefined
          ? window.pageYOffset
          : (document.documentElement || document.body.parentNode || document.body).scrollTop;

      window.onscroll = () => window.scrollTo(x, y);
    };

    const enableScrolling = () => {
      window.onscroll = () => noop;
    };

    const handleSave = useCallback(() => {
      onDataProviderEdited({
        andProviderId,
        excluded: getExcludedFromSelection(updatedOperator),
        field: updatedField.length > 0 ? updatedField[0].label : '',
        id: timelineId,
        operator: getQueryOperatorFromSelection(updatedOperator),
        providerId,
        value: updatedValue,
        type,
      });
    }, [
      onDataProviderEdited,
      andProviderId,
      updatedOperator,
      updatedField,
      timelineId,
      providerId,
      updatedValue,
      type,
    ]);

    useEffect(() => {
      disableScrolling();
      return () => {
        enableScrolling();
      };
    }, []);

    return (
      <EuiPanel paddingSize="s">
        <EuiFlexGroup direction="column" gutterSize="none">
          <EuiFlexItem grow={true}>
            <EuiFormRow label={i18n.FIELD}>
              <EuiComboBox
                autoFocus
                data-test-subj="field"
                isClearable={false}
                onChange={onFieldSelected}
                options={getCategorizedFieldNames(browserFields)}
                placeholder={i18n.FIELD_PLACEHOLDER}
                selectedOptions={updatedField}
                singleSelection={{ asPlainText: true }}
                fullWidth={true}
              />
            </EuiFormRow>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiSpacer size="m" />
          </EuiFlexItem>

          <EuiFlexItem grow={true}>
            <EuiFlexGroup gutterSize="s" direction="row" justifyContent="spaceBetween">
              <EuiFlexItem grow={true}>
                <EuiFormRow label={i18n.OPERATOR}>
                  <EuiComboBox
                    data-test-subj="operator"
                    isClearable={false}
                    onChange={onOperatorSelected}
                    options={operatorLabels}
                    placeholder={i18n.SELECT_AN_OPERATOR}
                    selectedOptions={updatedOperator}
                    singleSelection={{ asPlainText: true }}
                    style={{ minWidth: OPERATOR_COMBO_BOX_WIDTH }}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiSpacer size="m" />
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            {showValueInput && (
              <EuiFormRow label={i18n.VALUE_LABEL}>
                <ControlledDefaultInput
                  disableButtonCallback={disableButtonCallback}
                  onChangeCallback={onValueChange}
                  type={type}
                  value={value}
                />
              </EuiFormRow>
            )}

            {showComboBoxInput && (
              <EuiFormRow label={i18n.VALUE_LABEL}>
                <ControlledComboboxInput
                  disableButtonCallback={disableButtonCallback}
                  onChangeCallback={onValueChange}
                  type={type}
                  value={value}
                />
              </EuiFormRow>
            )}
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiSpacer size="m" />
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiFlexGroup justifyContent="flexEnd" gutterSize="none">
              <EuiFlexItem grow={false}>
                <EuiButton
                  className={SAVE_CLASS_NAME}
                  color="primary"
                  data-test-subj="save"
                  fill={true}
                  isDisabled={
                    !selectionsAreValid({
                      browserFields,
                      selectedField: updatedField,
                      selectedOperator: updatedOperator,
                    }) || disableButton
                  }
                  onClick={handleSave}
                  size="m"
                >
                  {i18n.SAVE}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
);

StatefulEditDataProvider.displayName = 'StatefulEditDataProvider';

function isStringOrNumberArray(
  val: string | number | Array<string | number>
): val is Array<string | number> {
  return Array.isArray(val) && (typeof val[0] === 'string' || typeof val[0] === 'number');
}

const isValueFieldInvalid = (type: DataProviderType, value: string | number) =>
  type !== DataProviderType.template &&
  (startsWith('{', sanatizeValue(value)) || endsWith('}', sanatizeValue(value)));

interface ControlledDataProviderInput {
  disableButtonCallback: (disableButton: boolean) => void;
  onChangeCallback: (value: string | number | string[]) => void;
  type: DataProviderType;
  value: string | number | Array<string | number>;
}

const getDefaultValue = (value: string | number | Array<string | number>): string | number => {
  if (isStringOrNumberArray(value)) {
    return value[0];
  } else return value;
};

const ControlledDefaultInput = ({
  value,
  type,
  disableButtonCallback,
  onChangeCallback,
}: ControlledDataProviderInput) => {
  const [primitiveValue, setPrimitiveValue] = useState<string | number>(getDefaultValue(value));

  const isInvalid = useMemo(
    () => isValueFieldInvalid(type, primitiveValue),
    [type, primitiveValue]
  );

  useEffect(() => {
    onChangeCallback(primitiveValue);
    disableButtonCallback(isInvalid);
  }, [primitiveValue, isInvalid, onChangeCallback, disableButtonCallback]);

  const onValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPrimitiveValue(e.target.value);
  }, []);

  return (
    <EuiFieldText
      className={VALUE_INPUT_CLASS_NAME}
      onChange={onValueChange}
      placeholder={i18n.VALUE}
      value={sanatizeValue(primitiveValue)}
      isInvalid={isInvalid}
    />
  );
};

const convertValuesToComboboxValueArray = (
  values: string | number | Array<string | number>
): EuiComboBoxOptionOption[] => {
  if (isStringOrNumberArray(values)) {
    return values.map((item) => ({ label: String(item) }));
  } else return [];
};

const convertComboboxValuesToStringArray = (values: EuiComboBoxOptionOption[]): string[] => {
  return values.map((item) => item.label);
};

const ControlledComboboxInput = ({
  value,
  onChangeCallback,
  type,
  disableButtonCallback,
}: ControlledDataProviderInput) => {
  const [includeValues, setIncludeValues] = useState(convertValuesToComboboxValueArray(value));

  const isInvalid = useMemo(
    () => includeValues.every((item) => isValueFieldInvalid(type, item.label)),
    [type, includeValues]
  );

  useEffect(() => {
    onChangeCallback(convertComboboxValuesToStringArray(includeValues));
    disableButtonCallback(isInvalid);
  }, [includeValues, isInvalid, onChangeCallback, disableButtonCallback]);

  const onCreateOption = (searchValue: string, flattenedOptions = includeValues) => {
    const normalizedSearchValue = searchValue.trim().toLowerCase();

    if (!normalizedSearchValue) {
      return;
    }

    if (
      flattenedOptions.findIndex(
        (option) => option.label.trim().toLowerCase() === normalizedSearchValue
      ) === -1
    ) {
      setIncludeValues([
        ...includeValues,
        {
          label: searchValue,
        },
      ]);
    }
  };

  const onIncludeValueChanged = useCallback((updatedIncludesValues: EuiComboBoxOptionOption[]) => {
    setIncludeValues(updatedIncludesValues);
  }, []);

  return (
    <EuiComboBox
      noSuggestions
      isClearable={true}
      data-test-subj="operator"
      selectedOptions={includeValues}
      placeholder={i18n.ENTER_ONE_OR_MORE_VALUES}
      onCreateOption={onCreateOption}
      onChange={onIncludeValueChanged}
    />
  );
};
