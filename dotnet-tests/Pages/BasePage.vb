Imports Microsoft.Playwright

Public MustInherit Class BasePage

    Protected ReadOnly PageObj As IPage

    Public Sub New(page As IPage)
        PageObj = page
    End Sub

    Public Async Function NavigateAsync(url As String) As Task
        Await PageObj.GotoAsync(url, New PageGotoOptions With {.WaitUntil = WaitUntilState.DOMContentLoaded})
    End Function

    Public Async Function GetTitleAsync() As Task(Of String)
        Return Await PageObj.TitleAsync()
    End Function

    Public Function GetCurrentUrl() As String
        Return PageObj.Url
    End Function

End Class
