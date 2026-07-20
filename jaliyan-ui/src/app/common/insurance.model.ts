/**
 * A padyatri together with the status of their insurance cover.
 *
 * The insurance company hands the organizer physical policy covers with the
 * padyatri name written in English. The organizer finds the matching padyatri
 * (searching by name/batch id in Gujarati or English), writes the batch id on
 * the cover, and marks the policy as received here.
 */
export interface PadyatriInsurance {
  padyatriId: number;
  firstName: string;      // stored in Gujarati
  lastName: string;       // stored in Gujarati
  fullName: string;       // convenience: firstName + lastName (Gujarati)
  batchId: number;
  mobile: string;
  photoPath?: string;
  insuranceReceived: boolean;
  receivedTime?: string | null;
  receivedBy?: string | null;
}

export interface InsuranceSummary {
  total: number;
  received: number;
  pending: number;
}

export interface MarkInsurancePayload {
  padyatriId: number;
  received: boolean;
  markedBy: string;
}
