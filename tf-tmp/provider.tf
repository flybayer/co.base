
terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
      version = "2.2.0"
    }
  }
}


variable "do_token" {
    
}
# variable "pvt_key" {}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_database_db" "sitename-db" {
  cluster_id = digitalocean_database_cluster.sitename-pg-cluster.id
  name       = "sitename-db"
}

resource "digitalocean_database_cluster" "sitename-pg-cluster" {
  name       = "sitename-pg-main"
  engine     = "pg"
  version    = "11"
  size       = "db-s-1vcpu-1gb"
  region     = "nyc1"
  node_count = 1
}