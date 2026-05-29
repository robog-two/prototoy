import React from 'react'
import { ToastContainer } from '../styles/AppStyles'

interface ToastProps {
  message: string
}

export default function Toast({ message }: ToastProps): React.ReactElement {
  return <ToastContainer>{message}</ToastContainer>
}
