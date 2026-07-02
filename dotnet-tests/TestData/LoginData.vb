Public Class LoginCredential
    Public Property Username As String
    Public Property Password As String

    Public Sub New(username As String, password As String)
        Me.Username = username
        Me.Password = password
    End Sub
End Class

Public Module LoginData

    Public ReadOnly ValidUser As New LoginCredential("sajith_xyz", "User@123")
    Public ReadOnly InvalidUser As New LoginCredential("wrong_user", "WrongPass@999")

    Public ReadOnly LongUsername As String = New String("a"c, 256)
    Public ReadOnly LongPassword As String = "P@ssword" & New String("x"c, 248)
    Public Const SqlInjection As String = "' OR 1=1 --"
    Public Const SqlInjectionPwd As String = "' OR '1'='1"
    Public Const XssPayload As String = "<script>alert('xss')</script>"
    Public Const SpecialChars As String = "!@#$%^&*()"
    Public Const WhitespaceOnly As String = "   "

End Module
