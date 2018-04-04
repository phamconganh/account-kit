// model read file
const fs = require('fs');

/**
 * [load file signup.html to string]
 * @return {String} [string show for file signup.html]
 */
function loadSignUp() {
  return fs.readFileSync('view/signUp.html').toString();
}

/**
 * [load file sign_in.html to string]
 * @return {String} [string show for file sign_in.html]
 */
function loadSignIn() {
  return fs.readFileSync('view/signIn.html').toString();
}

/**
 * [load file signInSuccess.html to string]
 * @return {String} [string show for file signInSuccess.html]
 */
function loadSignInSuccess() {
  return fs.readFileSync('view/signInSuccess.html').toString();
}

/**
 * [load file forgotPassword.html to string]
 * @return {String} [string show for file forgotPassword.html]
 */
function loadForgotPassword() {
  return fs.readFileSync('view/forgotPassword.html').toString();
}

/**
 * [load file changePassword.html to string]
 * @return {String} [string show for file changePassword.html]
 */
function loadEditPassword() {
  return fs.readFileSync('view/editPassword.html').toString();
}

module.exports = {
	loadSignUp: loadSignUp,
	loadSignIn: loadSignIn,
	loadSignInSuccess: loadSignInSuccess,
	loadForgotPassword: loadForgotPassword,
	loadEditPassword: loadEditPassword
}