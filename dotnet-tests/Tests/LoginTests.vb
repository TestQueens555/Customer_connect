Imports System.Text.RegularExpressions
Imports Microsoft.Playwright.MSTest
Imports Microsoft.VisualStudio.TestTools.UnitTesting

' Port of tests/login.spec.js — same 20 cases (TC-LOGIN-001..020), same POM split.
<TestClass>
Public Class LoginTests
    Inherits PageTest

    Private LoginUrl As String = "http://customerportal.dev-ts.online/Account/Login?ReturnUrl=%2F"
    Private LoginPageObj As LoginPage

    <TestInitialize>
    Public Async Function SetupAsync() As Task
        LoginPageObj = New LoginPage(Page)
        Await Context.ClearCookiesAsync()
        Await LoginPageObj.NavigateAsync(LoginUrl)
    End Function

    ' ══════════════ POSITIVE ═══════════════════════════════════════════════════

    <TestMethod>
    <TestCategory("smoke")>
    <TestCategory("critical")>
    Public Async Function TC_LOGIN_001_ValidCredentialsRedirectToDashboard() As Task
        Await LoginPageObj.LoginAsync(LoginData.ValidUser.Username, LoginData.ValidUser.Password)
        Await Expect(Page).Not.ToHaveURLAsync(New Regex("Login"))
        Dim title = Await Page.TitleAsync()
        Assert.IsTrue(title.Contains("Dashboard"))
    End Function

    <TestMethod>
    <TestCategory("smoke")>
    <TestCategory("ui")>
    Public Async Function TC_LOGIN_002_LoginPageLoadsWithAllRequiredUiElements() As Task
        Dim title = Await Page.TitleAsync()
        Assert.AreEqual("Sign In", title)
        Await Expect(Page.Locator("#UserName")).ToBeVisibleAsync()
        Await Expect(Page.Locator("#Password")).ToBeVisibleAsync()
        Await Expect(Page.Locator("#RememberMe")).ToBeVisibleAsync()
        Await Expect(Page.Locator("button[type=""submit""]")).ToBeVisibleAsync()
    End Function

    <TestMethod>
    <TestCategory("smoke")>
    <TestCategory("ui")>
    Public Async Function TC_LOGIN_003_PasswordFieldMaskedByDefault() As Task
        Assert.AreEqual("password", Await LoginPageObj.GetPasswordInputTypeAsync())
    End Function

    <TestMethod>
    <TestCategory("regression")>
    Public Async Function TC_LOGIN_004_PasswordShowHideToggleChangesInputType() As Task
        Assert.AreEqual("password", Await LoginPageObj.GetPasswordInputTypeAsync())
        Await LoginPageObj.TogglePasswordVisibilityAsync()
        Assert.AreEqual("text", Await LoginPageObj.GetPasswordInputTypeAsync())
    End Function

    <TestMethod>
    <TestCategory("regression")>
    Public Async Function TC_LOGIN_005_RememberMeCheckboxTogglesCheckedUnchecked() As Task
        Await LoginPageObj.CheckRememberMeAsync()
        Assert.IsTrue(Await LoginPageObj.IsRememberMeCheckedAsync())
        Await LoginPageObj.UncheckRememberMeAsync()
        Assert.IsFalse(Await LoginPageObj.IsRememberMeCheckedAsync())
    End Function

    ' ══════════════ NEGATIVE ═══════════════════════════════════════════════════

    <TestMethod>
    <TestCategory("smoke")>
    <TestCategory("negative")>
    Public Async Function TC_LOGIN_006_InvalidUsernameAndPasswordShowsError() As Task
        Await LoginPageObj.LoginAsync(LoginData.InvalidUser.Username, LoginData.InvalidUser.Password)
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
        StringAssert.Contains(Await LoginPageObj.GetErrorMessageAsync(), "Invalid user name or password")
    End Function

    <TestMethod>
    <TestCategory("negative")>
    Public Async Function TC_LOGIN_007_EmptyUsernameAndPasswordFormBlocked() As Task
        Await LoginPageObj.LoginAsync("", "")
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
    End Function

    <TestMethod>
    <TestCategory("negative")>
    Public Async Function TC_LOGIN_008_ValidUsernameEmptyPasswordBlocked() As Task
        Await LoginPageObj.LoginAsync(LoginData.ValidUser.Username, "")
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
    End Function

    <TestMethod>
    <TestCategory("negative")>
    Public Async Function TC_LOGIN_009_EmptyUsernameValidPasswordBlocked() As Task
        Await LoginPageObj.LoginAsync("", LoginData.ValidUser.Password)
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
    End Function

    <TestMethod>
    <TestCategory("negative")>
    Public Async Function TC_LOGIN_010_WrongUsernameCorrectPasswordRejected() As Task
        Await LoginPageObj.LoginAsync(LoginData.InvalidUser.Username, LoginData.ValidUser.Password)
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
        StringAssert.Contains(Await LoginPageObj.GetErrorMessageAsync(), "Invalid user name or password")
    End Function

    <TestMethod>
    <TestCategory("negative")>
    Public Async Function TC_LOGIN_011_CorrectUsernameWrongPasswordRejected() As Task
        Await LoginPageObj.LoginAsync(LoginData.ValidUser.Username, LoginData.InvalidUser.Password)
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
        StringAssert.Contains(Await LoginPageObj.GetErrorMessageAsync(), "Invalid user name or password")
    End Function

    ' ══════════════ BOUNDARY ═══════════════════════════════════════════════════

    <TestMethod>
    <TestCategory("boundary")>
    Public Async Function TC_LOGIN_012_256CharUsernameHandledGracefully() As Task
        Await LoginPageObj.LoginAsync(LoginData.LongUsername, "anything")
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
        Dim title = Await Page.TitleAsync()
        Assert.IsFalse(title.Contains("500"))
    End Function

    <TestMethod>
    <TestCategory("boundary")>
    Public Async Function TC_LOGIN_013_256CharPasswordHandledGracefully() As Task
        Await LoginPageObj.LoginAsync(LoginData.ValidUser.Username, LoginData.LongPassword)
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
        Dim title = Await Page.TitleAsync()
        Assert.IsFalse(title.Contains("500"))
    End Function

    <TestMethod>
    <TestCategory("boundary")>
    Public Async Function TC_LOGIN_014_WhitespaceOnlyUsernameRejected() As Task
        Await LoginPageObj.LoginAsync(LoginData.WhitespaceOnly, LoginData.ValidUser.Password)
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
    End Function

    <TestMethod>
    <TestCategory("boundary")>
    Public Async Function TC_LOGIN_015_SpecialCharactersInUsernameHandledSafely() As Task
        Await LoginPageObj.LoginAsync(LoginData.SpecialChars, LoginData.ValidUser.Password)
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
        Dim title = Await Page.TitleAsync()
        Assert.IsFalse(title.Contains("500"))
    End Function

    <TestMethod>
    <TestCategory("boundary")>
    Public Async Function TC_LOGIN_016_UsernameIsCaseInsensitive() As Task
        Await LoginPageObj.LoginAsync("SAJITH_XYZ", LoginData.ValidUser.Password)
        Await Expect(Page).Not.ToHaveURLAsync(New Regex("Login"))
        Dim title = Await Page.TitleAsync()
        Assert.IsTrue(title.Contains("Dashboard"))
    End Function

    ' ══════════════ SECURITY ═══════════════════════════════════════════════════

    <TestMethod>
    <TestCategory("security")>
    Public Async Function TC_LOGIN_017_SqlInjectionInUsernameHandledSafely() As Task
        Await LoginPageObj.LoginAsync(LoginData.SqlInjection, "anything")
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
        Dim title = Await Page.TitleAsync()
        Assert.IsFalse(title.Contains("500"))
    End Function

    <TestMethod>
    <TestCategory("security")>
    Public Async Function TC_LOGIN_018_SqlInjectionInPasswordHandledSafely() As Task
        Await LoginPageObj.LoginAsync(LoginData.ValidUser.Username, LoginData.SqlInjectionPwd)
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
        Dim title = Await Page.TitleAsync()
        Assert.IsFalse(title.Contains("500"))
    End Function

    <TestMethod>
    <TestCategory("security")>
    Public Async Function TC_LOGIN_019_XssPayloadInUsernameHandledSafely() As Task
        Await LoginPageObj.LoginAsync(LoginData.XssPayload, "anything")
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
        Dim title = Await Page.TitleAsync()
        Assert.IsFalse(title.Contains("500"))
    End Function

    <TestMethod>
    <TestCategory("security")>
    Public Async Function TC_LOGIN_020_UnauthenticatedAccessRedirectsToLogin() As Task
        Await Context.ClearCookiesAsync()
        Await Page.GotoAsync("http://customerportal.dev-ts.online/", New PageGotoOptions With {.WaitUntil = WaitUntilState.DOMContentLoaded})
        Await Page.WaitForTimeoutAsync(500)
        Await Expect(Page).ToHaveURLAsync(New Regex("Login"))
    End Function

End Class
