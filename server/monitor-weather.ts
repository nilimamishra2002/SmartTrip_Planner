import axios from "axios";
import prisma from "@/prisma/prisma-client";
import cron from "node-cron";

 type TripData = {
  journeyDate: string;
  checkPoints: {
    latitude: number;
    longitude: number;
  }[];
};

const checkOrNotifyWeather = async (checkPoint: {
  latitude: number;
  longitude: number;
  tripPlanId: string;
}) => {
  try {
    const response = await axios.get(
      `http://api.weatherapi.com/v1/current.json?key=7e4d6f0a8f4e4d8e9d0134202213107&q=${checkPoint.latitude},${checkPoint.longitude}`
    );

    const weatherData = response.data;
    const temperature = weatherData.current.temp_c;
    const condition = weatherData.current.condition.text;
    const location = weatherData.location.name;

    console.log(`Temperature at ${location} is ${temperature}°C and condition is ${condition}`);

    const isGoodWeather = condition.toLowerCase().includes("clear") || condition.toLowerCase().includes("sunny");

    return {
      location,
      temperature,
      condition,
      isGoodWeather,
    };
  } catch (error: any) {
  console.error(`Failed to fetch weather data: ${error?.message}`);
    return null;
  }
};

async function monitorTrips() {
  const monitoringTrips = await prisma.tripPlan.findMany({
    select: {
      id: true,
      data: true,
    },
  });

  const currentDate = new Date();

for (const trip of monitoringTrips) {
  const tripData = trip.data as unknown as TripData;

  const journeyDate = new Date(tripData.journeyDate);
  if (journeyDate < currentDate) continue;

  const checkPoints = tripData.checkPoints;
  const weatherResults = [];

  for (const checkPoint of checkPoints) {
    const weatherResult = await checkOrNotifyWeather({
      latitude: checkPoint.latitude,
      longitude: checkPoint.longitude,
      tripPlanId: trip.id,
    });

    if (weatherResult) {
      weatherResults.push(weatherResult);
    }
  }

  if (weatherResults.length > 0) {
    const combinedWeather = weatherResults
      .map(
        (result) =>
          `${result.location}: ${result.temperature}°C, ${result.condition}`
      )
      .join("; ");

    const isGoodWeather = weatherResults.every(
      (result) => result.isGoodWeather
    );

    await prisma.notification.create({
      data: {
        tripPlan: {
          connect: { id: trip.id },
        },
        content: `Weather update: ${combinedWeather}. Overall: ${
          isGoodWeather ? "good" : "bad"
        }.`,
      },
    });
  }
}
}

export const startMonitoring = async () => { 
 
  await monitorTrips();

  // Schedule the task to run every day at 12 PM
  cron.schedule('0 12 * * *', async () => {
    await monitorTrips();
  });
 
};