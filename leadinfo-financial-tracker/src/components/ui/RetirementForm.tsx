import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import { DollarSign, FileText, User as UserIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TAX LINE MAPPING — per Form 1120-S / Schedule C (PDF)
//   Employee contribution → W-2 Box 12 (Code D)
//   Employer contribution → Line 17 (Pension, profit-sharing plans)
// ─────────────────────────────────────────────────────────────────────────────
export const RETIREMENT_TAX_MAP = {
  employee: {
    tax_line: "W-2 Box 12",
    tax_category: "Retirement",
  },
  employer: {
    tax_line: "Line 17",
    tax_category: "Retirement",
  },
};

export interface RetirementRecordFormData {
  employee_name: string;
  contribution_date: string;
  employee_contribution: number;
  employer_contribution: number;
  notes: string;
  // ✅ Tax line fields stored separately for each contribution type
  employee_tax_line: string;
  employee_tax_category: string;
  employer_tax_line: string;
  employer_tax_category: string;
}

interface RetirementFormProps {
  initialData?: RetirementRecordFormData | null;
  onSubmit: (data: RetirementRecordFormData) => Promise<void> | void;
  onCancelEdit?: () => void;
}

export default function RetirementForm({ initialData, onSubmit, onCancelEdit }: RetirementFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [employeeName, setEmployeeName] = useState('');
  const [employeeContribution, setEmployeeContribution] = useState('');
  const [employerContribution, setEmployerContribution] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      const [y, m, d] = initialData.contribution_date.split("-");
      setDate(new Date(Number(y), Number(m) - 1, Number(d)));
      setEmployeeName(initialData.employee_name);
      setEmployeeContribution(initialData.employee_contribution.toString());
      setEmployerContribution(initialData.employer_contribution.toString());
      setNotes(initialData.notes);
    } else {
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setDate(new Date());
    setEmployeeName('');
    setEmployeeContribution('');
    setEmployerContribution('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName) return;

    const payload: RetirementRecordFormData = {
      employee_name: employeeName,
      contribution_date: format(date, 'yyyy-MM-dd'),
      employee_contribution: Number(employeeContribution) || 0,
      employer_contribution: Number(employerContribution) || 0,
      notes,
      // ✅ Always stamp the correct tax lines — never left blank
      employee_tax_line: RETIREMENT_TAX_MAP.employee.tax_line,
      employee_tax_category: RETIREMENT_TAX_MAP.employee.tax_category,
      employer_tax_line: RETIREMENT_TAX_MAP.employer.tax_line,
      employer_tax_category: RETIREMENT_TAX_MAP.employer.tax_category,
    };

    console.log("401k SUBMIT →", payload);

    await onSubmit(payload);

    if (!initialData) {
      resetForm();
    }
  };

  return (
    <Card className="bg-[var(--color-surface)] border-[var(--color-border)] h-fit sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg text-[var(--color-text-primary)]">
          {initialData ? 'Edit 401k Record' : 'Add 401k Record'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contribution-date" className="text-[var(--color-text-secondary)]">
              Contribution Date
            </Label>
            <CustomDatePicker selectedDate={date} onChange={setDate} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-name" className="text-[var(--color-text-secondary)]">
              Employee Name
            </Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
              <Input
                id="employee-name"
                placeholder="e.g. John Doe"
                className="pl-10 bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
              />
            </div>
          </div>

          {/* Employee Contribution — W-2 Box 12 */}
          <div className="space-y-2">
            <Label htmlFor="employee-contribution" className="text-[var(--color-text-secondary)]">
              Employee Contribution

            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
              <Input
                id="employee-contribution"
                type="number"
                placeholder="0.00"
                className="pl-10 bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                value={employeeContribution}
                onChange={(e) => setEmployeeContribution(e.target.value)}
              />
            </div>
          </div>

          {/* Employer Contribution — Line 17 */}
          <div className="space-y-2">
            <Label htmlFor="employer-contribution" className="text-[var(--color-text-secondary)]">
              Employer Contribution

            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
              <Input
                id="employer-contribution"
                type="number"
                placeholder="0.00"
                className="pl-10 bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                value={employerContribution}
                onChange={(e) => setEmployerContribution(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[var(--color-text-secondary)]">
              Notes
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
              <Input
                id="notes"
                placeholder="Optional notes"
                className="pl-10 bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {initialData && onCancelEdit && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-highlight)]"
                onClick={onCancelEdit}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              {initialData ? 'Update Data' : 'Add Data'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}