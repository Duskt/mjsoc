#[macro_export]
macro_rules! parsed_env {
    ($name:literal, $type:ty) => {
        $crate::expect_env!($name).parse::<$type>().expect(&format!(
            "{} was not able to be parsed as {:?}",
            $name,
            stringify!($type)
        ))
    };
}

#[macro_export]
macro_rules! expect_env {
    ($name:literal) => {
        std::env::var($name).expect(&format!("No {} environment variable found", $name))
    };
}
