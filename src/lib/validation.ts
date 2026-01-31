// 校验结果类型
export interface ValidationResult {
  valid: boolean;
  message: string;
}

// 邮箱格式校验
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { valid: false, message: '请输入邮箱' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: '邮箱格式不正确' };
  }
  
  return { valid: true, message: '' };
}

// 密码长度校验：8-14位
export function validatePasswordLength(password: string): ValidationResult {
  if (!password) {
    return { valid: false, message: '请输入密码' };
  }
  
  if (password.length < 8) {
    return { valid: false, message: '密码至少8位' };
  }
  
  if (password.length > 14) {
    return { valid: false, message: '密码最多14位' };
  }
  
  return { valid: true, message: '' };
}

// 密码强度校验：8-14位，大写、小写、数字、符号至少三种
export function validatePasswordStrength(password: string): ValidationResult {
  // 先校验长度
  const lengthCheck = validatePasswordLength(password);
  if (!lengthCheck.valid) {
    return lengthCheck;
  }
  
  // 校验复杂度
  let strength = 0;
  if (/[a-z]/.test(password)) strength++; // 小写
  if (/[A-Z]/.test(password)) strength++; // 大写
  if (/[0-9]/.test(password)) strength++; // 数字
  if (/[^a-zA-Z0-9]/.test(password)) strength++; // 符号
  
  if (strength < 3) {
    return { valid: false, message: '密码需包含大写、小写、数字、符号中的至少三种' };
  }
  
  return { valid: true, message: '' };
}

// 确认密码校验
export function validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { valid: false, message: '请确认密码' };
  }
  
  if (password !== confirmPassword) {
    return { valid: false, message: '两次输入的密码不一致' };
  }
  
  return { valid: true, message: '' };
}

// 登录表单校验
export function validateLoginForm(email: string, password: string): {
  emailError: string;
  passwordError: string;
  isValid: boolean;
} {
  const emailResult = validateEmail(email);
  const passwordResult = validatePasswordLength(password);
  
  return {
    emailError: emailResult.message,
    passwordError: passwordResult.message,
    isValid: emailResult.valid && passwordResult.valid,
  };
}

// 注册表单校验
export function validateRegisterForm(
  email: string,
  password: string,
  confirmPassword: string
): {
  emailError: string;
  passwordError: string;
  confirmPasswordError: string;
  isValid: boolean;
} {
  const emailResult = validateEmail(email);
  const passwordResult = validatePasswordStrength(password);
  const confirmResult = validateConfirmPassword(password, confirmPassword);
  
  return {
    emailError: emailResult.message,
    passwordError: passwordResult.message,
    confirmPasswordError: confirmResult.message,
    isValid: emailResult.valid && passwordResult.valid && confirmResult.valid,
  };
}
