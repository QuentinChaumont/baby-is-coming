import { addMonths, effectiveAnonymizeAt } from './birth-list.defaults';

describe('birth-list defaults', () => {
  it('adds calendar months, clamping to the end of shorter months', () => {
    expect(addMonths('2027-03-15', 6)).toBe('2027-09-15');
    expect(addMonths('2027-08-31', 6)).toBe('2028-02-29'); // leap year
    expect(addMonths('2026-08-31', 6)).toBe('2027-02-28');
    expect(addMonths('2027-11-30', 3)).toBe('2028-02-29');
  });

  it('anonymizes 6 months after the due date unless a date is set', () => {
    expect(effectiveAnonymizeAt({ dueDate: null, anonymizeAt: null })).toBeNull();
    expect(effectiveAnonymizeAt({ dueDate: '2027-03-15', anonymizeAt: null })).toBe(
      '2027-09-15',
    );
    expect(
      effectiveAnonymizeAt({ dueDate: '2027-03-15', anonymizeAt: '2027-06-01' }),
    ).toBe('2027-06-01');
  });
});
