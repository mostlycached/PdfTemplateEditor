export interface PDFDocument {
  id: number;
  userId?: number;
  originalName: string;
  fileName: string;
  createdAt: string;
  isModified: boolean;
  customizations?: string;
}

export interface TemplateInfo {
  id: number;
  name: string;
  imagePath: string;
  category: string;
}

export interface CustomizationOptions {
  title: string;
  subtitle: string;
  presenter: string;
  date: string;
  colorScheme: string;
  fontFamily: string;
  titleSize: string;
  titleAlignment: 'left' | 'center' | 'right';
  backgroundStyle: string;
  backgroundOpacity: number;
  templateId: number;
}
