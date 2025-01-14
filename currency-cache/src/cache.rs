use std::{collections::HashMap, path::PathBuf};

use jiff::{tz::TimeZone, Timestamp, ToSpan, ZonedRound};
use reqwest::Client;
use serde_json::Value;

pub struct CacheManager {
    data_dir: PathBuf,
    currencies: Option<Value>,
    historical: HashMap<String, Value>,
    client: Client,
    api_key: String,
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

    pub async fn latest(&mut self) -> anyhow::Result<Value> {
        let timestamp = Self::get_nearest_date(&Timestamp::now().to_string())?;
        let date = &timestamp.to_string()[..10];
        self.historical(date).await
    }

    pub async fn historical(&mut self, date: &str) -> anyhow::Result<Value> {
        let json = self.historical.get(date);
        if let Some(json) = json {
            return Ok(json.clone());
        }
        let path = self.data_dir.join(format!("historical_{date}.json"));
        if path.exists() {
            let json = Self::fetch_from_dir(&path).await?;
            self.historical.insert(date.to_string(), json.clone());
            return Ok(json);
        }
        let url = "https://api.currencyapi.com/v3/historical";
        let url = reqwest::Url::parse_with_params(url, &[("date", date)])?;
        let json = self.reqwest_download(url).await?;
        tokio::fs::write(&path, serde_json::to_string(&json)?).await?;
        self.historical.insert(date.to_string(), json.clone());
        Ok(json)
    }

    pub async fn currencies(&mut self) -> anyhow::Result<Value> {
        if let Some(json) = &self.currencies {
            return Ok(json.clone());
        }
        let path = self.data_dir.join("currencies.json");
        if path.exists() {
            let json = Self::fetch_from_dir(&path).await?;
            self.currencies = Some(json.clone());
            return Ok(json);
        }
        let url = "https://api.currencyapi.com/v3/currencies";
        let url = reqwest::Url::parse(url)?;
        let json = self.reqwest_download(url).await?;
        tokio::fs::write(&path, serde_json::to_string(&json)?).await?;
        self.currencies = Some(json.clone());
        Ok(json)
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
