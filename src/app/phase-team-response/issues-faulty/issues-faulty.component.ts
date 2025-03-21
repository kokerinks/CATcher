import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Issue } from '../../core/models/issue.model';
import { UserRole } from '../../core/models/user.model';
import { IssueService } from '../../core/services/issue.service';
import { PermissionService } from '../../core/services/permission.service';
import { UserService } from '../../core/services/user.service';
import { TABLE_COLUMNS } from '../../shared/issue-tables/issue-tables-columns';
import { ACTION_BUTTONS, IssueTablesComponent } from '../../shared/issue-tables/issue-tables.component';

@Component({
  selector: 'app-issues-faulty',
  templateUrl: './issues-faulty.component.html',
  styleUrls: ['./issues-faulty.component.css']
})
export class IssuesFaultyComponent implements OnInit, OnChanges {
  displayedColumns: string[];
  filter: (issue: Issue) => boolean;

  readonly actionButtons: ACTION_BUTTONS[] = [ACTION_BUTTONS.VIEW_IN_WEB, ACTION_BUTTONS.FIX_ISSUE];

  @Input() teamFilter: string;

  @ViewChild(IssueTablesComponent, { static: true }) table: IssueTablesComponent;

  constructor(public issueService: IssueService, public userService: UserService, public permissions: PermissionService) {
    if (userService.currentUser.role === UserRole.Student) {
      this.displayedColumns = [
        TABLE_COLUMNS.NO,
        TABLE_COLUMNS.TITLE,
        TABLE_COLUMNS.TYPE,
        TABLE_COLUMNS.SEVERITY,
        TABLE_COLUMNS.RESPONSE,
        TABLE_COLUMNS.ASSIGNEE,
        TABLE_COLUMNS.DUPLICATED_ISSUES,
        TABLE_COLUMNS.ACTIONS
      ];
    } else {
      this.displayedColumns = [
        TABLE_COLUMNS.NO,
        TABLE_COLUMNS.TITLE,
        TABLE_COLUMNS.TEAM_ASSIGNED,
        TABLE_COLUMNS.TYPE,
        TABLE_COLUMNS.SEVERITY,
        TABLE_COLUMNS.RESPONSE,
        TABLE_COLUMNS.ASSIGNEE,
        TABLE_COLUMNS.DUPLICATED_ISSUES,
        TABLE_COLUMNS.ACTIONS
      ];
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.teamFilter.isFirstChange()) {
      this.table.issues.teamFilter = changes.teamFilter.currentValue;
    }
  }

  ngOnInit() {
    this.filter = (issue: Issue): boolean => {
      const hasTeamResponse = (issue: Issue) => this.issueService.hasTeamResponse(issue.id);
      const isDuplicateIssue = (issue: Issue) => !!issue.duplicateOf;
      const isDuplicatedBy = (issue: Issue) =>
        !!this.issueService.issues$.getValue().filter((childIssue) => childIssue.duplicateOf === issue.id).length;
      const isTransitiveDuplicate = hasTeamResponse(issue) && isDuplicateIssue(issue) && isDuplicatedBy(issue);

      const hasStatus = (issue: Issue) => !!issue.status;
      const hasParseErrors = (issue: Issue) => !!issue.teamResponseError;
      const hasWrongHeaders = hasStatus(issue) && hasParseErrors(issue);

      return isTransitiveDuplicate || hasWrongHeaders;
    };
  }

  applyFilter(filterValue: string) {
    this.table.issues.filter = filterValue;
  }
}
