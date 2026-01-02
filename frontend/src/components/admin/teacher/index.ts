// Main Components
export { default as TeacherForm } from "./TeacherForm";

// Sub Components
export { default as BasicInfo } from "./BasicInfo";
export { default as AddressInfo } from "./AddressInfo";
export { default as QualificationsInfo } from "./QualificationsInfo";
export { default as PhotoUpload } from "./PhotoUpload";
export { default as CredentialsDisplay } from "./CredentialsDisplay";

// Component Types
export type {
  TeacherFormData,
  Credentials,
  TeacherFormProps,
  BasicInfoProps,
  AddressInfoProps,
  QualificationsProps,
  PhotoUploadProps,
  CredentialsDisplayProps,
} from "./types.js";
