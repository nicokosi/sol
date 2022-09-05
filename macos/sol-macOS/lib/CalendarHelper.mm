#import <Foundation/Foundation.h>
#import "CalendarHelper.h"
#import <EventKit/EKEventStore.h>

@implementation CalendarHelper

-(void)requestCalendarAccess:(void(^)(void))callback {
  EKEventStore *store = [[EKEventStore alloc] init];
  [store requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL granted, NSError * _Nullable error) {
    if(granted) {
      callback();
    }
  }];
}

-(NSArray<EKEvent *> *)getEvents {
  EKEventStore *store = [[EKEventStore alloc] init];
  NSArray *calendars = [store calendarsForEntityType:EKEntityTypeEvent];
  NSCalendar *gregorian = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];

  NSDateComponents *fiveDaysComponent = [[NSDateComponents alloc] init];
  fiveDaysComponent.day = 5;
  NSDate *nextDate = [gregorian dateByAddingComponents:fiveDaysComponent toDate:[NSDate date] options:0];

  NSPredicate *predicate = [store predicateForEventsWithStartDate:[NSDate date] endDate:nextDate calendars:calendars];
  return [store eventsMatchingPredicate:predicate];
}

-(NSString *)getCalendarAuthorizationStatus {
  EKAuthorizationStatus status = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
  switch (status) {
    case EKAuthorizationStatusDenied:
      return @"denied";

    case EKAuthorizationStatusAuthorized:
      return @"authorized";

    case EKAuthorizationStatusRestricted:
      return @"restricted";

    case EKAuthorizationStatusNotDetermined:
    default:
      return @"notDetermined";
  }
}

@end
