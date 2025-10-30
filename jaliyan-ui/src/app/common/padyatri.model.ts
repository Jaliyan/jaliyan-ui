// user.model.ts
export interface Padyatri {
  padyatriId: number;
  firstName: string;
  lastName: string;
  age: number;
  gender?: string;
  address?: string;
  mobile: string;
  alternateNumber?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  padyatraId: number;
  createdBy: string;
  photoPath : string;
  batchId: number;
  }
  
  export interface CreatePadyatriDto {
  firstName: string;
  lastName: string;
  age: number;
  gender?: string;
  address?: string;
  mobile: string;
  alternateNumber?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  padyatraId: number;
  createdBy: string;
}


export interface PadyatriAttendance {
  padyatriId: number;
  fullName: string;
  batchId: number;
  isPresent: boolean;
  attendanceTime: string;
}

export interface PadyatriItem {
  padyatriId: number;
  fullName: string;
  batchId: number;
  items: { [key: string]: boolean };
}

export interface PadyatriReport {
  padyatriId: number;
  fullName: string;
  batchId: number;
  isPresent: boolean;
  attendanceTime: string;
}