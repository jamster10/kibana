/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RuleUpdateProps } from '@kbn/security-solution-plugin/common/detection_engine/rule_schema';

/**
 * This is a typical simple rule for testing that is easy for most basic testing
 * @param ruleId The rule id
 * @param enabled Set to true to enable it, by default it is off
 */
export const getSimpleRuleUpdate = (ruleId = 'rule-1', enabled = false): RuleUpdateProps => ({
  name: 'Simple Rule Query',
  description: 'Simple Rule Query',
  enabled,
  risk_score: 1,
  rule_id: ruleId,
  severity: 'high',
  index: ['auditbeat-*'],
  type: 'query',
  query: 'user.name: root or user.name: admin',
});
