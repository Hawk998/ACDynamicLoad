```mermaid
erDiagram
    CONFIG {
        string voltagehostIP
        string currenthostIP
        number voltageLimit
        number currentLimit
        number maxkWValue
        string cdsIP
    }
    LOGFILE {
        string filePath
        date timestamp
        string message
    }
    SESSION {
        string id
        string name
        date startTime
        date endTime
        string status
    }
    CHARTDATA {
        string timeLabels
        string voltageData
        string currentData
        string powerData
        string setpointData
        string sinkPowerData
        number maxPowerLimit
    }
    MEASUREMENT {
        date timestamp
        number powerValue
        number voltageValue
        number currentValue
        number sinkPower
        boolean sinkSuccess
    }

    CONFIG ||--o| SESSION : configures
    SESSION ||--|{ MEASUREMENT : records
    SESSION ||--o| LOGFILE : logs
    SESSION ||--o| CHARTDATA : visualized_by
    MEASUREMENT ||--o| CHARTDATA : used_for