use chrono::{Duration, Local, NaiveDateTime};

pub struct Quota {
    remaining: i32,
    last_replenished: NaiveDateTime,

    burst_size: i32,
    replenish_period: Duration,
}

impl Quota {
    pub fn new(burst_size: i32, replenish_period: Duration) -> Self {
        Self {
            remaining: burst_size,
            last_replenished: Local::now().naive_local(),

            burst_size,
            replenish_period,
        }
    }

    pub fn replenish(&mut self) -> bool {
        let now = Local::now().naive_local();

        let amount = (now - self.last_replenished).num_milliseconds()
            / self.replenish_period.num_milliseconds();

        if amount > 0 {
            // Remove any negative remaining
            self.remaining = i32::max(self.remaining, 0);

            // Add on correct amount for wait period and limit to burst size
            self.remaining += amount as i32;
            self.remaining = i32::min(self.remaining, self.burst_size);
            self.last_replenished = now;

            return true;
        }

        false
    }

    pub fn use_one(&mut self) -> i32 {
        self.remaining -= 1;
        self.remaining
    }

    pub fn until_replenish(&self) -> Duration {
        self.replenish_period - (Local::now().naive_local() - self.last_replenished)
    }
}
