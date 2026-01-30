//------------------------------------user roles Enums--------------------------------//
export const UserRolesEnum = {
  ADMIN: 'admin',
  PROJECT_ADMIN: 'project_admin',
  MEMBER: 'member',
}

export const AvailableUserRoles = Object.values(UserRolesEnum)

//--------------------------task status enums-------------------------

export const TaskStatusEnum = {
  TODO: 'to_do',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done', 
}

export const AvailableTaskStatuses = Object.values(TaskStatusEnum)
