use std::{
    fs::{self, File},
    io::Write,
    path::Path,
};
use clap::{Args, Parser};
use lib::{qr::get_qr_data, util::get_file_bytes, env};
use zip::{write::FileOptions, ZipWriter};

/// CLI for Mahjong Soc Attendance
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
enum AppArgs {
    /// Bulk generate QRs from a list of names
    #[command(arg_required_else_help = true)]
    BulkQr(BulkQrArgs),
}

/// Bulk generate QRs from a list of names
#[derive(Args, Debug)]
struct BulkQrArgs {
    /// A list of names to convert to QRs
    #[arg()]
    names: Vec<String>,

    /// Each line in the file is used as a name for a QR
    #[arg(short, long)]
    input_file: Option<String>,

    /// Base URL e.g. `https://mjsocbath.com`
    #[arg(short = 'u', long)]
    base_url: String,

    /// Output file path
    #[arg(short, long, default_value_t = String::from("output.zip"))]
    output_file: String,
}

pub fn main() {
    dotenvy::dotenv().expect(".env file not found.");
    let args = AppArgs::parse();

    match args {
        AppArgs::BulkQr(args) => bulk_qr(args),
    }
}

fn bulk_qr(args: BulkQrArgs) {
    let mut names = args.names;

    if let Some(input_file) = args.input_file {
        let lines = fs::read_to_string(input_file).expect("Couldn't open file");

        names.append(
            &mut lines
                .split('\n')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect(),
        );
    }

    let hmac_key_path = env::expect_env("HMAC_KEY_PATH");
    let hmac_key = get_file_bytes(&hmac_key_path);

    let path = Path::new(&args.output_file);
    let file = File::create(path).unwrap();
    let mut zip = ZipWriter::new(file);

    for name in names {
        zip.start_file(format!("{name}.svg"), FileOptions::default())
            .unwrap();

        let qr = get_qr_data(&name, &args.base_url, &hmac_key).unwrap();
        zip.write_all(qr.svg.as_bytes()).unwrap();
    }

    zip.finish().unwrap();
}
