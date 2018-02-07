import React from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup } from 'react-bootstrap';
import { Grid, Row, Col } from 'react-bootstrap'

import Button from '../../components/Button';
import CssEditor from './CssEditor';
import RefreshIntervalModal from './RefreshIntervalModal';
import SaveModal from './SaveModal';
import CodeModal from './CodeModal';
import SliceAdder from './SliceAdder';
import { t } from '../../locales';
import { getExploreUrl } from '../../explore/exploreUtils';
import Control from '../../explore/components/Control';
import '../../../stylesheets/dashboard.css';
const $ = window.$ = require('jquery');

const propTypes = {
  dashboard: PropTypes.object.isRequired,
  slices: PropTypes.array,
  userId: PropTypes.string.isRequired,
  addSlicesToDashboard: PropTypes.func,
  onSave: PropTypes.func,
  onChange: PropTypes.func,
  readFilters: PropTypes.func,
  renderSlices: PropTypes.func,
  serialize: PropTypes.func,
  startPeriodicRender: PropTypes.func,
  saveSlice: PropTypes.func,
  setControlValue: PropTypes.func
};

class Controls extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      css: props.dashboard.css || '',
      cssTemplates: [],
    };
  }
  componentWillMount() {
    $.get('/csstemplateasyncmodelview/api/read', (data) => {
      const cssTemplates = data.result.map(row => ({
        value: row.template_name,
        css: row.css,
        label: row.template_name,
      }));
      this.setState({ cssTemplates });
    });
  }
  refresh() {
    // Force refresh all slices
    this.props.renderSlices(true);
  }
  changeCss(css) {
    this.setState({ css });
    this.props.onChange();
  }
  render() {
    const { dashboard, userId,
      addSlicesToDashboard, startPeriodicRender, readFilters,
      serialize, onSave, saveSlice, setControlValue} = this.props;
    const emailBody = t('Checkout this dashboard: %s', window.location.href);
    const emailLink = 'mailto:?Subject=Superset%20Dashboard%20'
      + `${dashboard.dashboard_title}&Body=${emailBody}`;
    return (

      <div>

        <div>
          <Grid>
          <Row className="add_margin_bottom">
              <Col md={2} mdOffset={8}>
                <Control actions={{setControlValue: setControlValue}} type="DateFilterControl" name="since" label="Since" value={dashboard.controls.since.value} />
              </Col>

              <Col md={2}>
                <Control actions={{setControlValue: setControlValue}} type="DateFilterControl" name="until" label="Until" value={dashboard.controls.until.value} />
              </Col>
            </Row>

            <Row className="add_margin_bottom">
              <Col md={4} mdOffset={8}>
                <Button 
                    tooltip={t('Apply changes to dashboard')}

                    onClick={() => {
                      dashboard.slices.forEach((slice, ndx, arr) => {
                        var form_data = {
                          ...slice.form_data, 
                          since: dashboard.controls.since.value,
                          until: dashboard.controls.until.value 
                        }

                        var sliceParams = {
                          action: "overwrite",
                          slice_id: slice.slice_id,
                          slice_name: slice.slice_name,
                          add_to_dash: "noSave"
                        }

                        const saveUrl = getExploreUrl(form_data, 'base', false, null, sliceParams);
                        //refresh dashboard after all graphs have been changed
                        saveSlice(saveUrl).then((data) => window.location = (ndx === arr.length - 1 ) ? data.dashboard.substring(0, data.dashboard.length - 7) : window.location )
                      })
                    }}
                  >
                    Update all charts
                  </Button>
              </Col>
            </Row>
            
            <Row>
              <Col md={4} mdOffset={8}>
                <ButtonGroup>

                  <Button
                    tooltip={t('Force refresh the whole dashboard')}
                    onClick={this.refresh.bind(this)}
                  >
                    <i className="fa fa-refresh" />
                  </Button>
                  <SliceAdder
                    dashboard={dashboard}
                    addSlicesToDashboard={addSlicesToDashboard}
                    userId={userId}
                    triggerNode={
                      <i className="fa fa-plus" />
                    }
                  />
                  <RefreshIntervalModal
                    onChange={refreshInterval => startPeriodicRender(refreshInterval * 1000)}
                    triggerNode={
                      <i className="fa fa-clock-o" />
                    }
                  />
                  <CodeModal
                    codeCallback={readFilters}
                    triggerNode={<i className="fa fa-filter" />}
                  />
                  <CssEditor
                    dashboard={dashboard}
                    triggerNode={
                      <i className="fa fa-css3" />
                    }
                    initialCss={dashboard.css}
                    templates={this.state.cssTemplates}
                    onChange={this.changeCss.bind(this)}
                  />
                  <Button
                    onClick={() => { window.location = emailLink; }}
                  >
                    <i className="fa fa-envelope" />
                  </Button>
                  <Button
                    disabled={!dashboard.dash_edit_perm}
                    onClick={() => {
                      window.location = `/dashboardmodelview/edit/${dashboard.id}`;
                    }}
                    tooltip={t('Edit this dashboard\'s properties')}
                  >
                    <i className="fa fa-edit" />
                  </Button>
                  <SaveModal
                    dashboard={dashboard}
                    readFilters={readFilters}
                    serialize={serialize}
                    onSave={onSave}
                    css={this.state.css}
                    triggerNode={
                      <Button disabled={!dashboard.dash_save_perm}>
                        <i className="fa fa-save" />
                      </Button>
                    }
                  />
                  </ButtonGroup>
              </Col>
 
            </Row>
          </Grid>
        </div>

        
      </div>
    );
  }
}
Controls.propTypes = propTypes;

export default Controls;
