import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, listUsers, resetUserPassword, setUserActive, updateUser, type UserInput } from './api'

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: listUsers })
}

function useInvalidateUsers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['users'] })
}

export function useSaveUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, input, password }: { id: number | null; input: UserInput; password?: string }) =>
      id === null ? createUser({ ...input, temporary_password: password ?? '' }) : updateUser(id, input),
    onSuccess: invalidate,
  })
}

export function useSetUserActive() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setUserActive(id, isActive),
    onSuccess: invalidate,
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => resetUserPassword({ id, new_password: password }),
  })
}
