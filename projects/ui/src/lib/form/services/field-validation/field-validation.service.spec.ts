import { TestBed } from '@angular/core/testing';
import { ArtFieldValidationService } from './field-validation.service';

describe('ArtFieldValidationService', () => {
  const svc = () => TestBed.inject(ArtFieldValidationService);
  const keys = async (value: unknown, validators: any[], all = {}) => (await svc().validate(value, { validators }, all)).map((r) => r.errorKey);

  it('required : null, vide, tableau vide', async () => {
    for (const v of [null, undefined, '', []]) expect(await keys(v, [{ type: 'required' }])).toEqual(['required']);
    expect(await keys('x', [{ type: 'required' }])).toEqual([]);
    expect(await keys({ name: 'f.pdf' }, [{ type: 'required' }])).toEqual([]); // valeur d'un champ file
  });
  it('un champ optionnel vide ne déclenche ni email, ni url, ni pattern, ni minLength', async () => {
    expect(await keys('', [{ type: 'email' }, { type: 'url' }, { type: 'pattern', pattern: '^a$' }, { type: 'minLength', length: 3 }])).toEqual([]);
  });
  it('longueurs, min/max numériques et dates', async () => {
    expect(await keys('ab', [{ type: 'minLength', length: 3 }])).toEqual(['minLength']);
    expect(await keys('abcd', [{ type: 'maxLength', length: 3 }])).toEqual(['maxLength']);
    expect(await keys(2, [{ type: 'min', value: 5 }])).toEqual(['min']);
    expect(await keys(9, [{ type: 'max', value: 5 }])).toEqual(['max']);
    expect(await keys('2020-01-01', [{ type: 'min', value: '2021-01-01' }])).toEqual(['min']);
  });
  it('email, url, pattern', async () => {
    expect(await keys('nope', [{ type: 'email' }])).toEqual(['email']);
    expect(await keys('a@b.co', [{ type: 'email' }])).toEqual([]);
    expect(await keys('nope', [{ type: 'url' }])).toEqual(['url']);
    expect(await keys('https://a.test', [{ type: 'url' }])).toEqual([]);
    expect(await keys('abc', [{ type: 'pattern', pattern: '^\\d+$' }])).toEqual(['pattern']);
  });
  it('custom sync/async avec accès aux autres valeurs ; message personnalisé ; stopOnFirstError', async () => {
    const r = await svc().validate('x', { validators: [{ type: 'custom', fn: (_v: unknown, all?: Record<string, unknown>) => (all?.['other'] ? 'conflit' : null) }] }, { other: 1 });
    expect(r[0].message).toBe('conflit');
    const a = await svc().validate('x', { validators: [{ type: 'custom', asyncFn: async () => 'KO' }] });
    expect(a[0].valid).toBe(false);
    const m = await svc().validate('', { validators: [{ type: 'required', message: 'Obligatoire !' }] });
    expect(m[0].message).toBe('Obligatoire !');
    const s = await svc().validate('', { stopOnFirstError: true, validators: [{ type: 'required' }, { type: 'custom', fn: () => 'x' }] });
    expect(s.length).toBe(1);
  });
});
