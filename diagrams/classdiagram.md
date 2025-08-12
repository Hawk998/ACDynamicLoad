``` mermaid
classDiagram
    class ElectronApp {
        +mainWindow: BrowserWindow
        +init()
        +IPC handlers
    }
    class BrowserWindow
    ElectronApp --> BrowserWindow

    class SCPIHelper {
        +setVoltagePriorityMode()
        +setCurrentPriorityMode()
        +setOutput()
        +defineVoltageCurrent()
        +setCurrentSetPoint()
        +getSinkPowerValue()
    }
    ElectronApp --> SCPIHelper

    class CDSHelper {
        +readEvseMaxCurrentAc()
        +readEvDuty()
        +measuredVoltageL1()
        +measuredCurrentL1()
        +read_P_real()
    }
    ElectronApp --> CDSHelper

    class PollHelper {
        +startPollingCDS()
        +stopPollingCDS()
        +getLastPowerCDS()
        +startSinkPowerPolling()
        +stopSinkPowerPolling()
        +getLastSinkPowerValue()
        +CSV logging
    }
    ElectronApp --> PollHelper

    class Logging {
        +logging()
    }
    ElectronApp --> Logging

    class GlobalPaths {
        +storagePath
        +configStoragePath
        +configFilePath
        +logfilePath
    }
    ElectronApp --> GlobalPaths

    class SvelteStore {
        +activeElement
        +navigation
        +splitScreenActive
    }
    class TabHelper {
        +openTab()
        +changeActiveTab()
        +handleSplitScreen()
        +splitScreen()
        +closeTab()
    }
    SvelteStore --> TabHelper

    class ChartConfig {
        +ChartData
        +createPowerChart()
        +updateChartData()
        +updateMaxPowerLine()
        +calcPower()
    }
    SvelteStore --> ChartConfig

    class LoadSession {
        ControlPanel
        Measurements
        ChartDiagram
    }
    class Home {
        PageSelection
    }
    class ConfigPage{
        ModuleConfiguration
    }
    class RemotePage{
        WebfrontendAccess
    }
    SvelteStore --> LoadSession
    SvelteStore --> Home
    SvelteStore --> ConfigPage
    SvelteStore --> RemotePage

    ElectronApp <..> SvelteStore : IPC/Preload Bridge

    ``` 