import { MultiFilter } from './multi-filter.js';
import { UnusedComponents } from './cleanup.js';

export default function flipPlugin() {
  return {
    id: 'flip',
    decorators: {
      oas3: {
        'multi-filter': MultiFilter,
        'unused-components': UnusedComponents,
      },
    },
  };
}
