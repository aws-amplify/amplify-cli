"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ElasticsearchUtils {
    toEqExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        const updatedFieldName = typeof value === 'string' ? fieldName + '.keyword' : fieldName;
        return this.toMatchExpression(updatedFieldName, value);
    }
    toNeExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        return this.toNotExpression(this.toEqExpression(fieldName, value));
    }
    toMatchExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        return {
            [ElasticsearchUtils.MATCH]: {
                [fieldName]: value,
            },
        };
    }
    toMatchPhraseExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        return {
            [ElasticsearchUtils.MATCH_PHRASE]: {
                [fieldName]: value,
            },
        };
    }
    toMatchPhrasePrefixExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        return {
            [ElasticsearchUtils.MATCH_PHRASE_PREFIX]: {
                [fieldName]: value,
            },
        };
    }
    toMultiMatchExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        return {
            [ElasticsearchUtils.MULTI_MATCH]: {
                [fieldName]: value,
            },
        };
    }
    toExistsExpression(fieldName, value) {
        if (!fieldName || typeof value !== 'boolean') {
            return null;
        }
        if (value) {
            return {
                [ElasticsearchUtils.EXISTS]: {
                    [ElasticsearchUtils.FIELD]: fieldName,
                },
            };
        }
        else {
            return {
                [ElasticsearchUtils.BOOL]: {
                    [ElasticsearchUtils.MUST_NOT]: {
                        [ElasticsearchUtils.EXISTS]: {
                            [ElasticsearchUtils.FIELD]: fieldName,
                        },
                    },
                },
            };
        }
    }
    toWildcardExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        return {
            [ElasticsearchUtils.WILDCARD]: {
                [fieldName]: value,
            },
        };
    }
    toRegularExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        return {
            [ElasticsearchUtils.REGEXP]: {
                [fieldName]: value,
            },
        };
    }
    toGtExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        return {
            [ElasticsearchUtils.RANGE]: {
                [fieldName]: {
                    [ElasticsearchUtils.GT]: value,
                },
            },
        };
    }
    toGteExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        return {
            [ElasticsearchUtils.RANGE]: {
                [fieldName]: {
                    [ElasticsearchUtils.GTE]: value,
                },
            },
        };
    }
    toLTExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        return {
            [ElasticsearchUtils.RANGE]: {
                [fieldName]: {
                    [ElasticsearchUtils.LT]: value,
                },
            },
        };
    }
    toLTEExpression(fieldName, value) {
        if (!fieldName) {
            return null;
        }
        return {
            [ElasticsearchUtils.RANGE]: {
                [fieldName]: {
                    [ElasticsearchUtils.LTE]: value,
                },
            },
        };
    }
    toRangeExpression(fieldName, start, end) {
        if (!fieldName) {
            return null;
        }
        return {
            [ElasticsearchUtils.RANGE]: {
                [fieldName]: {
                    [ElasticsearchUtils.GTE]: start,
                    [ElasticsearchUtils.LTE]: end,
                },
            },
        };
    }
    toAndExpression(filterClauses) {
        if (!filterClauses || filterClauses.length == 0) {
            return null;
        }
        const andExpression = {
            [ElasticsearchUtils.BOOL]: {
                [ElasticsearchUtils.MUST]: filterClauses,
            },
        };
        return andExpression;
    }
    toOrExpression(filterClauses) {
        if (!filterClauses || filterClauses.length == 0) {
            return null;
        }
        const andExpression = {
            [ElasticsearchUtils.BOOL]: {
                [ElasticsearchUtils.SHOULD]: filterClauses,
                [ElasticsearchUtils.MINIMUM_SHOULD_MATCH]: ElasticsearchUtils.ONE,
            },
        };
        return andExpression;
    }
    toNotExpression(expression) {
        if (!expression) {
            return null;
        }
        const andExpression = {
            [ElasticsearchUtils.BOOL]: {
                [ElasticsearchUtils.MUST_NOT]: expression,
            },
        };
        return andExpression;
    }
}
ElasticsearchUtils.ONE = 1;
ElasticsearchUtils.BOOL = 'bool';
ElasticsearchUtils.MUST = 'must';
ElasticsearchUtils.MUST_NOT = 'must_not';
ElasticsearchUtils.SHOULD = 'should';
ElasticsearchUtils.MATCH = 'match';
ElasticsearchUtils.MATCH_PHRASE = 'match_phrase';
ElasticsearchUtils.MATCH_PHRASE_PREFIX = 'match_phrase_prefix';
ElasticsearchUtils.MULTI_MATCH = 'multi_match';
ElasticsearchUtils.EXISTS = 'exists';
ElasticsearchUtils.WILDCARD = 'wildcard';
ElasticsearchUtils.REGEXP = 'regexp';
ElasticsearchUtils.RANGE = 'range';
ElasticsearchUtils.GT = 'gt';
ElasticsearchUtils.GTE = 'gte';
ElasticsearchUtils.LT = 'lt';
ElasticsearchUtils.LTE = 'lte';
ElasticsearchUtils.MINIMUM_SHOULD_MATCH = 'minimum_should_match';
ElasticsearchUtils.FIELD = 'field';
exports.default = ElasticsearchUtils;
//# sourceMappingURL=elasticsearch-utils.js.map