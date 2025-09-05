import { TriageFormStepper } from "./TriageFormStepper";
import { ClientRiskAlert } from "./ClientRiskAlert";

interface TriageFormData {
  requested_amount: string;
  help_requested: string;
  circumstances: string;
  marital_status: string;
  spouse_name: string;
  spouse_phone: string;
  spouse_email: string;
  rent_paid_3mo: boolean;
  lease_in_name: boolean;
  utility_in_name: boolean;
  veteran_self: boolean;
  veteran_spouse: boolean;
  unemployed_self: boolean;
  unemployed_spouse: boolean;
  employer_self: string;
  employer_self_contact: string;
  employer_self_phone: string;
  employer_spouse: string;
  employer_spouse_contact: string;
  employer_spouse_phone: string;
  children_names_ages: string;
  govt_aid_unemployment: boolean;
  govt_aid_ss: boolean;
  govt_aid_disability: boolean;
  govt_aid_workers_comp: boolean;
  govt_aid_other: string;
  other_assistance_sources: string;
  consent_given: boolean;
}

interface TriageFormProps {
  assistanceRequestId: string;
  initialData?: Partial<TriageFormData>;
  onComplete: () => void;
  onCancel: () => void;
}

export const TriageForm = ({ 
  assistanceRequestId, 
  initialData, 
  onComplete, 
  onCancel 
}: TriageFormProps) => {
  return (
    <TriageFormStepper
      assistanceRequestId={assistanceRequestId}
      initialData={initialData}
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
};