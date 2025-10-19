// user.model.ts
export interface Padyatri {
    padyatriId: number,
    firstName: string,
    lastName: string,
    address: string,
    age: number,
    mobile: string,
    landlineNumber: string,
    alternateNumber: string,
    userType: string,
    batchId: number,
    padyatraId: number,
    yatraYear: string
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
