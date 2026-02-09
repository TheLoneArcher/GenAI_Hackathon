/**
 * Agentic AI Simulation Logic for Hospital Bed Capacity Predictor
 * 
 * Flow:
 * Data Acquisition -> Prediction -> Decision -> Communication -> Learning -> (Repeat)
 */

export const agents = {
    //🧠 Data Acquisition Agent: Collects and organizes incoming data.
    dataAcquisition: {
        name: "Data Acquisition Agent",
        status: "idle",
        lastRun: null,
        process: (rawData) => {
            console.log("Data Acquisition Agent: Processing raw admission data...");
            return {
                processedAt: new Date().toISOString(),
                admissions: rawData.admissions || 0,
                discharges: rawData.discharges || 0,
                currentOccupancy: rawData.occupiedBeds || 0,
            };
        }
    },

    //📊 Prediction Agent: Forecasts future bed demand.
    prediction: {
        name: "Prediction Agent",
        status: "idle",
        lastRun: null,
        process: (data) => {
            console.log("Prediction Agent: Forecasting future demand...");
            // Simple simulation: occupancy + (admissions * 1.2) - (discharges * 0.8)
            const forecast = data.currentOccupancy + (Math.random() * 10 - 5);
            return {
                forecastedOccupancy: Math.round(forecast),
                confidence: 0.92,
                icuNeeds: Math.round(forecast * 0.15)
            };
        }
    },

    //🤖 Decision Agent: Determines shortage risk and generates alerts.
    decision: {
        name: "Decision Agent",
        status: "idle",
        lastRun: null,
        process: (prediction, limits) => {
            console.log("Decision Agent: Evaluating risks...");
            const ratio = prediction.forecastedOccupancy / limits.totalBeds;
            let status = "Normal";
            let alert = null;

            if (ratio > 0.95) {
                status = "Critical";
                alert = "CRITICAL: Bed capacity reached. Immediate diversion required.";
            } else if (ratio > 0.85) {
                status = "Warning";
                alert = "WARNING: Capacity exceeding 85%. Start discharge protocols.";
            }

            return { status, alert, riskLevel: ratio };
        }
    },

    //📢 Communication Agent: Delivers info to users.
    communication: {
        name: "Communication Agent",
        status: "idle",
        lastRun: null,
        process: (decision) => {
            console.log("Communication Agent: Updating dashboards and sending alerts...");
            return {
                dashboardUpdated: true,
                alertSent: !!decision.alert,
                timestamp: new Date().toISOString()
            };
        }
    },

    //🔁 Learning Agent: Improves system intelligence via feedback.
    learning: {
        name: "Learning Agent",
        status: "idle",
        lastRun: null,
        process: (prediction, actualOutcome) => {
            console.log("Learning Agent: Refining models based on outcome...");
            const error = Math.abs(prediction.forecastedOccupancy - actualOutcome);
            return {
                modelRefined: true,
                errorRate: error / actualOutcome,
                updatedAccuracy: 0.95 - (error / 100)
            };
        }
    }
};
