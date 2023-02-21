// Vendor
import templateOnly from '@ember/component/template-only';

interface Args {
  label: string;
  helper?: string;
}

const FormField = templateOnly<Args>();

export default FormField;
