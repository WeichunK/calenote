// Calendar Types - 與後端 API schema 對應

export interface Calendar {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarDTO {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCalendarDTO extends Partial<CreateCalendarDTO> {
  is_default?: boolean;
}
