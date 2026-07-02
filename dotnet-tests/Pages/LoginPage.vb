Imports Microsoft.Playwright

Public Class LoginPage
    Inherits BasePage

    Private ReadOnly UsernameInput As ILocator
    Private ReadOnly PasswordInput As ILocator
    Private ReadOnly RememberMeCheckbox As ILocator
    Private ReadOnly SignInButton As ILocator
    Private ReadOnly PwdToggle As ILocator
    ' Error: span.text-sm.font-medium → "Invalid user name or password"
    Private ReadOnly ErrorMessageLocator As ILocator

    Public Sub New(page As IPage)
        MyBase.New(page)
        UsernameInput = page.Locator("#UserName")
        PasswordInput = page.Locator("#Password")
        RememberMeCheckbox = page.Locator("#RememberMe")
        SignInButton = page.Locator("button[type=""submit""]")
        PwdToggle = page.Locator("button[type=""button""]").First
        ErrorMessageLocator = page.Locator("span.text-sm.font-medium")
    End Sub

    Public Async Function EnterUsernameAsync(username As String) As Task
        Await UsernameInput.FillAsync(username)
    End Function

    Public Async Function EnterPasswordAsync(password As String) As Task
        Await PasswordInput.FillAsync(password)
    End Function

    Public Async Function CheckRememberMeAsync() As Task
        Await RememberMeCheckbox.CheckAsync()
    End Function

    Public Async Function UncheckRememberMeAsync() As Task
        Await RememberMeCheckbox.UncheckAsync()
    End Function

    Public Async Function IsRememberMeCheckedAsync() As Task(Of Boolean)
        Return Await RememberMeCheckbox.IsCheckedAsync()
    End Function

    Public Async Function TogglePasswordVisibilityAsync() As Task
        Await PwdToggle.ClickAsync()
        Await PasswordInput.WaitForAsync(New LocatorWaitForOptions With {.State = WaitForSelectorState.Visible})
    End Function

    ' Mirrors the JS page object: click via JS to dodge navigation timeouts on
    ' slow responses (e.g. SQL-injection payloads), then poll for either
    ' navigation away from Login or the error message becoming visible.
    Public Async Function ClickSignInAsync() As Task
        Await PageObj.EvaluateAsync("() => document.querySelector('button[type=""submit""]').click()")

        Dim deadline = DateTime.UtcNow.AddMilliseconds(20000)
        While DateTime.UtcNow < deadline
            If Not PageObj.Url.Contains("Login") Then Exit While
            If Await ErrorMessageLocator.IsVisibleAsync() Then Exit While
            Await PageObj.WaitForTimeoutAsync(200)
        End While

        Await SwallowAsync(PageObj.WaitForLoadStateAsync(LoadState.DOMContentLoaded))
    End Function

    Public Async Function LoginAsync(username As String, password As String) As Task
        Await EnterUsernameAsync(username)
        Await EnterPasswordAsync(password)
        Await ClickSignInAsync()
    End Function

    Public Async Function GetErrorMessageAsync() As Task(Of String)
        Try
            Dim text = Await ErrorMessageLocator.TextContentAsync(New LocatorTextContentOptions With {.Timeout = 3000})
            Return If(text, "").Trim()
        Catch
            Return ""
        End Try
    End Function

    Public Async Function IsErrorVisibleAsync() As Task(Of Boolean)
        Try
            Return Await ErrorMessageLocator.IsVisibleAsync()
        Catch
            Return False
        End Try
    End Function

    Public Async Function GetPasswordInputTypeAsync() As Task(Of String)
        Return Await PasswordInput.GetAttributeAsync("type")
    End Function

    Private Shared Async Function SwallowAsync(task As Task) As Task
        Try
            Await task
        Catch
        End Try
    End Function

End Class
