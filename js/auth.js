/* 登录注册模块：该登录系统仅用于前端课程演示，不适用于真实生产环境。 */
(function () {
  "use strict";

  function userKey(username) { return "TitanStory-user-" + username.trim(); }
  function showMessage(text, success) {
    const message = document.querySelector("#form-message");
    if (message) {
      message.textContent = text;
      message.style.color = success ? "#91a27e" : "#d98a82";
    }
  }

  function registerUser(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;
    if (username.length < 1) return showMessage("请输入用户名。", false);
    if (password.length < 1) return showMessage("请输入密码。", false);
    if (!form.elements.agreement.checked) return showMessage("请先同意用户协议。", false);
    if (localStorage.getItem(userKey(username))) return showMessage("该用户名已注册。", false);

    localStorage.setItem(userKey(username), JSON.stringify({ username, password, createdAt: new Date().toISOString() }));
    showMessage("注册成功，正在前往登录页……", true);
    setTimeout(function () { location.href = "login.html"; }, 700);
  }

  function loginUser(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;
    if (username.length < 1) return showMessage("请输入用户名。", false);
    if (password.length < 1) return showMessage("请输入密码。", false);
    let user = null;
    try { user = JSON.parse(localStorage.getItem(userKey(username))); } catch (error) { user = null; }
    if (!user || user.password !== password) return showMessage("用户名或密码不正确。", false);
    localStorage.setItem("TitanStory-current-user", username);
    if (form.elements.remember.checked) localStorage.setItem("TitanStory-remember-user", username);
    else localStorage.removeItem("TitanStory-remember-user");
    showMessage("登录成功，欢迎归队。", true);
    setTimeout(function () { location.href = "index.html"; }, 600);
  }

  function initializeAuth() {
    const registerForm = document.querySelector("#register-form");
    const loginForm = document.querySelector("#login-form");
    if (registerForm) registerForm.addEventListener("submit", registerUser);
    if (loginForm) {
      const remembered = localStorage.getItem("TitanStory-remember-user");
      if (remembered) { loginForm.elements.username.value = remembered; loginForm.elements.remember.checked = true; }
      loginForm.addEventListener("submit", loginUser);
    }
  }
  document.addEventListener("DOMContentLoaded", initializeAuth);
}());
