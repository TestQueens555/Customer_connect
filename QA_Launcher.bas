Attribute VB_Name = "QA_Launcher"
' ============================================================
' CustomerConnect QA Launcher
' Click "Init Reports" button to create blank Excel report files
' Claude then fills them automatically via Excel MCP
' ============================================================

Sub InitReports()
    Dim projectPath As String
    Dim cmd As String
    Dim result As Long

    projectPath = "D:\Claude\QA_Projects\CustomerConnect"

    ' Run init-reports.js using Node.js
    cmd = "cmd.exe /c cd /d """ & projectPath & """ && node utils\init-reports.js"

    result = Shell(cmd, vbHide)

    ' Wait 3 seconds for Node to finish
    Application.Wait Now + TimeValue("00:00:03")

    MsgBox "✅ Report files initialised!" & vbNewLine & vbNewLine & _
           "Files created in:" & vbNewLine & _
           "  • Featurewise Test Report\" & vbNewLine & _
           "  • Daily Bug Report\" & vbNewLine & vbNewLine & _
           "Claude will now fill them via Excel MCP.", _
           vbInformation, "QA Launcher"
End Sub

Sub RunTests(feature As String)
    Dim projectPath As String
    Dim cmd As String

    projectPath = "D:\Claude\QA_Projects\CustomerConnect"

    ' Run playwright tests for the feature
    cmd = "cmd.exe /c cd /d """ & projectPath & """ && npm run test:" & LCase(feature)

    Shell cmd, vbNormalFocus

    MsgBox "▶️ Running tests for: " & feature & vbNewLine & _
           "Check the terminal window for results.", _
           vbInformation, "QA Launcher"
End Sub

Sub RunLoginTests()
    Call RunTests("login")
End Sub

Sub RunAllTests()
    Dim projectPath As String
    projectPath = "D:\Claude\QA_Projects\CustomerConnect"
    Shell "cmd.exe /c cd /d """ & projectPath & """ && npm test", vbNormalFocus
    MsgBox "▶️ Running all tests..." & vbNewLine & _
           "Check the terminal window for results.", _
           vbInformation, "QA Launcher"
End Sub

Sub OpenFeaturewiseReport()
    Dim reportPath As String
    reportPath = "D:\Claude\QA_Projects\CustomerConnect\Featurewise Test Report\Login.xlsx"

    If Dir(reportPath) <> "" Then
        Workbooks.Open reportPath
    Else
        MsgBox "❌ Login.xlsx not found." & vbNewLine & _
               "Click 'Init Reports' first.", vbExclamation, "QA Launcher"
    End If
End Sub

Sub OpenDailyBugReport()
    Dim reportFolder As String
    Dim today As String
    Dim reportPath As String

    reportFolder = "D:\Claude\QA_Projects\CustomerConnect\Daily Bug Report\"
    today = Format(Now, "DD-MMM-YYYY")
    reportPath = reportFolder & "BugReport_" & today & ".xlsx"

    If Dir(reportPath) <> "" Then
        Workbooks.Open reportPath
    Else
        MsgBox "❌ BugReport_" & today & ".xlsx not found." & vbNewLine & _
               "Click 'Init Reports' first.", vbExclamation, "QA Launcher"
    End If
End Sub

Sub OpenHTMLReport()
    Dim reportPath As String
    reportPath = "D:\Claude\QA_Projects\CustomerConnect\reports\html-report\index.html"

    If Dir(reportPath) <> "" Then
        Shell "cmd.exe /c start """ & reportPath & """", vbHide
    Else
        MsgBox "❌ HTML report not found." & vbNewLine & _
               "Run tests first: npm run test:login", vbExclamation, "QA Launcher"
    End If
End Sub
