// Vendor
import templateOnly from '@ember/component/template-only';

// Types
import {Task} from 'better-trading/types/ember-concurrency';

interface Args {
  task: Task;
  size: 'small' | 'large';
}

const LoadingContainer = templateOnly<Args>();

export default LoadingContainer;
