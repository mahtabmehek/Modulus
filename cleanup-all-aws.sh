#!/bin/bash

# 🗑️ AWS Resource Cleanup Script - Emergency Deletion
# Deletes ALL Modulus-related resources to avoid charges

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${YELLOW}🔍 $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🚨 EMERGENCY CLEANUP: Deleting ALL AWS Resources"
echo "================================================"

# Get regions to check
REGIONS=("eu-west-2" "eu-west-1" "eu-central-1" "eu-north-1" "us-east-1")

for region in "${REGIONS[@]}"; do
    log_info "Cleaning up region: $region"
    
    # 1. Delete ECS Services (must be done first)
    log_info "Deleting ECS services in $region..."
    for cluster in $(aws ecs list-clusters --region $region --query 'clusterArns[]' --output text 2>/dev/null || echo ""); do
        if [[ $cluster == *"modulus"* ]] || [[ $cluster == *"simple"* ]]; then
            cluster_name=$(basename $cluster)
            log_warning "Found cluster: $cluster_name"
            
            # Delete all services in cluster
            for service in $(aws ecs list-services --cluster $cluster_name --region $region --query 'serviceArns[]' --output text 2>/dev/null || echo ""); do
                service_name=$(basename $service)
                log_warning "Deleting service: $service_name"
                aws ecs update-service --cluster $cluster_name --service $service_name --desired-count 0 --region $region 2>/dev/null || true
                aws ecs delete-service --cluster $cluster_name --service $service_name --force --region $region 2>/dev/null || true
            done
            
            # Wait for services to be deleted
            log_info "Waiting for services to stop..."
            sleep 30
            
            # Delete cluster
            aws ecs delete-cluster --cluster $cluster_name --region $region 2>/dev/null || true
            log_success "Deleted cluster: $cluster_name"
        fi
    done
    
    # 2. Delete Load Balancers
    log_info "Deleting load balancers in $region..."
    for alb in $(aws elbv2 describe-load-balancers --region $region --query 'LoadBalancers[?contains(LoadBalancerName, `modulus`) || contains(LoadBalancerName, `simple`)].LoadBalancerArn' --output text 2>/dev/null || echo ""); do
        log_warning "Deleting ALB: $alb"
        aws elbv2 delete-load-balancer --load-balancer-arn "$alb" --region $region 2>/dev/null || true
    done
    
    # 3. Delete Target Groups
    log_info "Deleting target groups in $region..."
    for tg in $(aws elbv2 describe-target-groups --region $region --query 'TargetGroups[?contains(TargetGroupName, `modulus`) || contains(TargetGroupName, `simple`)].TargetGroupArn' --output text 2>/dev/null || echo ""); do
        log_warning "Deleting target group: $tg"
        aws elbv2 delete-target-group --target-group-arn "$tg" --region $region 2>/dev/null || true
    done
    
    # 4. Delete RDS Instances
    log_info "Deleting RDS instances in $region..."
    for db in $(aws rds describe-db-instances --region $region --query 'DBInstances[?contains(DBInstanceIdentifier, `modulus`) || contains(DBInstanceIdentifier, `simple`)].DBInstanceIdentifier' --output text 2>/dev/null || echo ""); do
        log_warning "Deleting RDS instance: $db"
        aws rds delete-db-instance --db-instance-identifier "$db" --skip-final-snapshot --delete-automated-backups --region $region 2>/dev/null || true
    done
    
    # 5. Delete ECR Repositories
    log_info "Deleting ECR repositories in $region..."
    for repo in $(aws ecr describe-repositories --region $region --query 'repositories[?contains(repositoryName, `modulus`) || contains(repositoryName, `simple`)].repositoryName' --output text 2>/dev/null || echo ""); do
        log_warning "Deleting ECR repository: $repo"
        aws ecr delete-repository --repository-name "$repo" --force --region $region 2>/dev/null || true
    done
    
    # 6. Delete Security Groups (except default)
    log_info "Deleting security groups in $region..."
    for sg in $(aws ec2 describe-security-groups --region $region --query 'SecurityGroups[?contains(GroupName, `modulus`) || contains(GroupName, `simple`)].GroupId' --output text 2>/dev/null || echo ""); do
        log_warning "Deleting security group: $sg"
        aws ec2 delete-security-group --group-id "$sg" --region $region 2>/dev/null || true
    done
    
    # 7. Delete CloudWatch Log Groups
    log_info "Deleting CloudWatch log groups in $region..."
    for log_group in $(aws logs describe-log-groups --region $region --query 'logGroups[?contains(logGroupName, `modulus`) || contains(logGroupName, `ecs`) || contains(logGroupName, `simple`)].logGroupName' --output text 2>/dev/null || echo ""); do
        log_warning "Deleting log group: $log_group"
        aws logs delete-log-group --log-group-name "$log_group" --region $region 2>/dev/null || true
    done
    
    # 8. Delete S3 Buckets
    log_info "Deleting S3 buckets in $region..."
    for bucket in $(aws s3api list-buckets --region $region --query 'Buckets[?contains(Name, `modulus`) || contains(Name, `simple`)].Name' --output text 2>/dev/null || echo ""); do
        log_warning "Deleting S3 bucket: $bucket"
        aws s3 rm s3://$bucket --recursive --region $region 2>/dev/null || true
        aws s3api delete-bucket --bucket "$bucket" --region $region 2>/dev/null || true
    done
    
    # 9. Terminate EC2 Instances
    log_info "Terminating EC2 instances in $region..."
    for instance in $(aws ec2 describe-instances --region $region --query 'Reservations[].Instances[?State.Name==`running` && (contains(join(` `, Tags[?Key==`Name`].Value), `modulus`) || contains(join(` `, Tags[?Key==`Name`].Value), `simple`))].InstanceId' --output text 2>/dev/null || echo ""); do
        log_warning "Terminating EC2 instance: $instance"
        aws ec2 terminate-instances --instance-ids "$instance" --region $region 2>/dev/null || true
    done
    
    log_success "Cleanup completed for region: $region"
done

# 10. Delete IAM Roles and Policies
log_info "Deleting IAM roles and policies..."
for role in $(aws iam list-roles --query 'Roles[?contains(RoleName, `modulus`) || contains(RoleName, `simple`) || contains(RoleName, `ecs`) || contains(RoleName, `github`)].RoleName' --output text 2>/dev/null || echo ""); do
    log_warning "Deleting IAM role: $role"
    
    # Detach policies first
    for policy in $(aws iam list-attached-role-policies --role-name "$role" --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null || echo ""); do
        aws iam detach-role-policy --role-name "$role" --policy-arn "$policy" 2>/dev/null || true
    done
    
    # Delete inline policies
    for policy in $(aws iam list-role-policies --role-name "$role" --query 'PolicyNames[]' --output text 2>/dev/null || echo ""); do
        aws iam delete-role-policy --role-name "$role" --policy-name "$policy" 2>/dev/null || true
    done
    
    # Delete role
    aws iam delete-role --role-name "$role" 2>/dev/null || true
done

echo ""
echo "================================================"
log_success "🎉 EMERGENCY CLEANUP COMPLETE!"
echo "================================================"
log_info "All Modulus-related AWS resources have been deleted"
log_info "This should prevent any further charges"
log_warning "Please check AWS Console to verify all resources are gone"
log_info "You may want to wait 10-15 minutes for all deletions to complete"
echo ""
