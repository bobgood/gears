configuration_json = [
    {
        "Type": "Root",
        "Name": "Root",
        "Module": 1,
        "PressureAngle": "radians(20)",
        "Shift": 0,
        "N": 100,
        "Thickness": 2,
        "Slot1": {
            "HoleRadius": 2,
            "SlotWidth": 1,
            "SlotDepth": 2.5
        },
        "SlotShift": 0,
        "SliderToothShift": 0,
        "SliderEccentricity": 0,
        "SliderNumberOfTeeth": 12,
        "SliderZoom": 0,
        "SliderPanX": 0,
        "SliderPanY": 0,
        "SliderRotationY": 0,
        "SliderGearRot": 0
    },
    {
        "Type": "Camera",
        "Name": "Camera",
        "LookAtX": "neg(SliderPanX)",
        "LookAtY": "neg(SliderPanY)",
        "LookAtAngle": "radians(SliderRotationY)",
        "LookAtZoom": "SliderZoom",
    },
    {
        "Type": "AmbientLight",
        "Name": "AmbientLight",
    },
    {
        "Type": "DirectionalLight",
        "Name": "DirectionalLight",
        "LookAtAngle": "radians(SliderRotationY)",
    },

    
    {
        "Type": "SimpleGear",
        "Name": "gear1",
        "Module": "Module",
        "Shift": "neg(SliderToothShift)",
        "NumberOfTeeth": "max(4,SliderNumberOfTeeth)",
        "Color": "#0077ff",
        "Position": [0, 0, 0],
        "Slot": "Slot1",
        "RotationZ": "radians(SliderGearRot)",

    },
    {
        "Type": "SimpleGear",
        "Name": "gear2",
        "Module": "Module",
        "Shift": "sum(.5,SliderToothShift)",
        "NumberOfTeeth": "max(4,SliderNumberOfTeeth)",
        "Color": "#00ff88",
        "Slot": "Slot1",
        "PositionX": "mult(gear1.Rpitch, 2)",
        "RotationZ": "radians(neg(SliderGearRot))"

    },
    {
        "Type": "PlanetaryGear",
        "Name": "pgear",
        "Module": "Module",
        "Shift": "SliderToothShift",
        "NumberOfTeeth": "SliderNumberOfTeeth",
        "OusideRadius": "SliderNumberOfTeeth",
        "Color": "#ff77ff",
        "RotationZ": "radians(SliderGearRot)",
        "PositionZ": 5
    },
    {
        "Type": "EllipticalGear",
        "Name": "egear",
        "Module": "Module",
        "Eccentricity": "SliderEccentricity",
        "Shift": "SliderToothShift",
        "NumberOfTeeth": "SliderNumberOfTeeth",
        "RotationZ": "radians(SliderGearRot)",
        "Color": "#ffffff",
        "Slot": "Slot1",
        "PositionZ": 10,
        "PositionX": "neg(ave(egear.A, egear.B))"
    },
    {
        "Type": "EllipticalGear",
        "Name": "egear2",
        "Module": "Module",
        "Eccentricity": "SliderEccentricity",
        "Shift": "sum(.5,neg(SliderToothShift))",
        "NumberOfTeeth": "SliderNumberOfTeeth",
        "Color": "#ffff00",
        "Slot": "Slot1",
        "PositionZ": 10,
        "PositionX": "ave(egear.A, egear.B)",
        "RotationZ": "convert_angle_to_ellipse_pair(radians(SliderGearRot))"
    },
    {
        "Type": "FrameGear",
        "Name": "fgear",
        "Module": "Module",
        "NumberOfTeeth": "SliderNumberOfTeeth",
        "Color": "#0077ff",
        "FrameRadius": 6,
        "NumberOfSegments": 4,
        "FrameShift": 0,
        "HoleRadius": 1,
        "Tolerance": .6,
        "PositionZ": 15,
        "RotationZ": "radians(SliderGearRot)",
    }
]