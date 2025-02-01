use std::{collections::HashMap, path::PathBuf};

use jiff::{tz::TimeZone, Timestamp, ToSpan, ZonedRound};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use utoipa::ToSchema;

pub struct CacheManager {
    data_dir: PathBuf,
    currencies: Option<CurrenciesObject>,
    historical: HashMap<String, HistoricalObject>,
    client: Client,
    api_key: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct CurrenciesObject {
    pub data: HashMap<String, CurrencyObject>,
}

#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct CurrencyObject {
    pub symbol: String,
    pub name: String,
    pub symbol_native: String,
    pub decimal_digits: i32,
    pub rounding: i32,
    pub code: String,
    pub name_plural: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub countries: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct HistoricalObject {
    pub data: HashMap<String, CurrencyExObject>,
}

#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct CurrencyExObject {
    pub code: String,
    pub value: f64,
}

impl CacheManager {
    pub fn new(data_dir: PathBuf, api_key: String) -> Self {
        Self {
            data_dir,
            currencies: None,
            historical: HashMap::new(),
            client: Client::new(),
            api_key,
        }
    }

    pub async fn latest(&mut self) -> anyhow::Result<HistoricalObject> {
        let timestamp = Self::get_nearest_date(&Timestamp::now().to_string())?;
        let date = &timestamp.to_string()[..10];
        self.historical(date).await
    }

    pub async fn historical(&mut self, date: &str) -> anyhow::Result<HistoricalObject> {
        let value = self.historical.get(date);
        if let Some(value) = value {
            return Ok(value.clone());
        }
        let path = self.data_dir.join(format!("historical_{date}.json"));
        if path.exists() {
            let json = Self::fetch_from_dir(&path).await?;
            let value = serde_json::from_value::<HistoricalObject>(json)?;
            self.historical.insert(date.to_string(), value.clone());
            return Ok(value);
        }
        let url = "https://api.currencyapi.com/v3/historical";
        let url = reqwest::Url::parse_with_params(url, &[("date", date)])?;
        let json = self.reqwest_download(url).await?;
        tokio::fs::write(&path, serde_json::to_string(&json)?).await?;
        let value = serde_json::from_value::<HistoricalObject>(json)?;
        self.historical.insert(date.to_string(), value.clone());
        Ok(value)
    }

    pub async fn currencies(&mut self) -> anyhow::Result<CurrenciesObject> {
        if let Some(value) = &self.currencies {
            return Ok(value.clone());
        }
        let path = self.data_dir.join("currencies.json");
        if path.exists() {
            let json = Self::fetch_from_dir(&path).await?;
            let currencies = serde_json::from_value::<CurrenciesObject>(json)?;
            self.currencies = Some(currencies.clone());
            return Ok(currencies);
        }
        let url = "https://api.currencyapi.com/v3/currencies";
        let url = reqwest::Url::parse(url)?;
        let json = self.reqwest_download(url).await?;
        tokio::fs::write(&path, serde_json::to_string(&json)?).await?;
        let currencies = serde_json::from_value::<CurrenciesObject>(json)?;
        self.currencies = Some(currencies.clone());
        Ok(currencies)
    }

    async fn reqwest_download(&self, url: reqwest::Url) -> anyhow::Result<Value> {
        tracing::info!("downloaing url: {}", url);
        let response = self
            .client
            .get(url)
            .header("apikey", &self.api_key)
            .send()
            .await?;
        if response.status() != 200 {
            tracing::error!("failed to fetch data: {:?}", response);
            return Err(anyhow::anyhow!("failed to fetch data"))?;
        }
        let json = response.json::<serde_json::Value>().await?;
        Ok(json)
    }

    async fn fetch_from_dir(path: &PathBuf) -> anyhow::Result<Value> {
        let json = tokio::fs::read_to_string(&path).await?;
        let json = serde_json::from_str::<serde_json::Value>(&json)?;
        Ok(json)
    }

    fn get_nearest_date(timstamp_str: &str) -> anyhow::Result<Timestamp> {
        let timestamp = timstamp_str.parse::<Timestamp>()?;
        let date = timestamp.to_zoned(TimeZone::UTC).round(
            ZonedRound::new()
                .smallest(jiff::Unit::Day)
                .mode(jiff::RoundMode::Trunc),
        )?;
        let date = date.timestamp() - 1.second();
        Ok(date)
    }
}
