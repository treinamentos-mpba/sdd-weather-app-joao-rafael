export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  /** Identificador da cidade no provedor de geocoding, quando disponível. */
  providerId?: number;
  /** Nome exibido da cidade. */
  name: string;
  /** Latitude usada para consultar a previsão. */
  latitude: number;
  /** Longitude usada para consultar a previsão. */
  longitude: number;
  /** País informado pelo provedor, ou null quando ausente. */
  country: string | null;
  /** Região ou estado informado pelo provedor, ou null quando ausente. */
  region: string | null;
  /** Fuso IANA informado pelo geocoding, quando disponível. */
  timezone: string | null;
}

export interface CurrentWeather {
  /** Data e hora de referência do provedor em formato ISO 8601. */
  observedAt: string;
  /** Temperatura atual em Celsius, sem arredondamento de apresentação. */
  temperatureC: number;
  /** Sensação térmica em Celsius, sem arredondamento de apresentação. */
  apparentTemperatureC: number;
  /** Umidade relativa do ar em porcentagem. */
  relativeHumidityPercent: number;
  /** Velocidade do vento em quilômetros por hora. */
  windSpeedKmh: number;
  /** Precipitação acumulada no intervalo atual do provedor, em milímetros. */
  precipitationMm: number;
  /** Pressão atmosférica ao nível do mar em hectopascais. */
  pressureMslHpa: number;
  /** Código meteorológico WMO retornado pelo provedor. */
  weatherCode: number;
}

export interface ForecastDay {
  /** Data local da cidade no formato YYYY-MM-DD. */
  date: string;
  /** Temperatura máxima diária em Celsius. */
  temperatureMaxC: number;
  /** Temperatura mínima diária em Celsius. */
  temperatureMinC: number;
  /** Maior probabilidade de precipitação do dia, de 0 a 100 por cento. */
  precipitationProbabilityPercent: number;
  /** Código meteorológico WMO retornado pelo provedor. */
  weatherCode: number;
}

export interface WeatherData {
  /** Cidade selecionada para esta previsão. */
  city: City;
  /** Fuso IANA validado usado para apresentar datas e horários. */
  timezone: string;
  /** Condições atuais da cidade. */
  current: CurrentWeather;
  /** Cinco dias consecutivos, começando pela data local atual. */
  days: ForecastDay[];
}
