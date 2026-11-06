import { Injectable } from '@angular/core';
import {FieldValidation, FieldValidator, ValidationResult} from '../../models/form-builder.model';

@Injectable({
  providedIn: 'root'
})

export class ArtFieldValidationService {
  constructor() { }

  async validate(
    value: any,
    validation: FieldValidation,
    allValues: Record<string, any> = {}
  ): Promise<ValidationResult[]> {
    const errors: ValidationResult[] = [];

    for (const v of validation.validators) {
      const result = await this.runValidator(v, value, allValues);
      if (!result.valid) {
        errors.push(result);
        if (validation.stopOnFirstError) break;
      }
    }

    return errors;
  }

  private async runValidator(
    v: FieldValidator,
    value: any,
    allValues: Record<string, any>
  ): Promise<ValidationResult> {

    const fail = (key: string, msg: string): ValidationResult =>
      ({ valid: false, errorKey: key, message: v.message ?? msg });

    // Un champ OPTIONNEL vide est valide : seuls `required` et `custom` s'évaluent sur une valeur vide.
    const isEmpty = value == null || value === '' || (Array.isArray(value) && !value.length);
    if (isEmpty && v.type !== 'required' && v.type !== 'custom') return { valid: true };

    switch (v.type) {
      case 'required':
        if (value == null || value === '' || (Array.isArray(value) && !value.length))
          return fail('required', 'Ce champ est obligatoire');
        break;

      case 'minLength':
        if (String(value ?? '').length < (v.length ?? 0))
          return fail('minLength', `Minimum ${v.length} caractères`);
        break;

      case 'maxLength':
        if (String(value ?? '').length > (v.length ?? Infinity))
          return fail('maxLength', `Maximum ${v.length} caractères`);
        break;

      case 'min':
        if (v.value == null || value == null) break;
        // traiter les dates si l'un des deux est une Date ou une chaîne parseable en Date
        const valueIsDateLike =
          value instanceof Date ||
          v.value instanceof Date ||
          (typeof value === 'string' && !Number.isNaN(Date.parse(value))) ||
          (typeof v.value === 'string' && !Number.isNaN(Date.parse(String(v.value))));
        if (valueIsDateLike) {
          const left = value instanceof Date ? value.getTime() : Date.parse(String(value));
          const right = v.value instanceof Date ? v.value.getTime() : Date.parse(String(v.value));
          if (!Number.isNaN(left) && !Number.isNaN(right) && left < right)
            return fail('min', `Date minimale : ${v.value}`);
        } else {
          const leftNum = Number(value);
          const rightNum = Number(v.value);
          if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum) && leftNum < rightNum)
            return fail('min', `Valeur minimale : ${v.value}`);
        }
        break;

      case 'max':
        if (Number(value) > Number(v.value))
          return fail('max', `Valeur maximale : ${v.value}`);
        break;

      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '')))
          return fail('email', 'Format email invalide');
        break;

      case 'url':
        try { new URL(String(value ?? '')); }
        catch { return fail('url', 'URL invalide'); }
        break;

      case 'pattern':
        if (!new RegExp(v.pattern ?? '', v.flags).test(String(value ?? '')))
          return fail('pattern', 'Format invalide');
        break;

      case 'custom':
        if (v.asyncFn) {
          const msg = await v.asyncFn(value, allValues);
          if (msg) return fail('custom', msg);
        } else if (v.fn) {
          const msg = v.fn(value, allValues);
          if (msg) return fail('custom', msg);
        }
        break;
    }

    return { valid: true };
  }
}
